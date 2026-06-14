import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Only allow requests from your own domain (and localhost for dev)
const ALLOWED_ORIGINS = [
  "https://www.designforge.co.in",
  "https://designforge.co.in",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5001",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const jsonOk = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract the user's JWT from the Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return jsonOk(req, { error: "Missing authorization token" }, 401);
    }

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonOk(req, { error: "Invalid or expired token" }, 401);
    }

    // Fetch the candidate's current access level (using service role — bypasses RLS)
    const { data: candidate, error: candidateError } = await supabase
      .from("exam_candidates")
      .select("id, access_level, email, name")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (candidateError || !candidate) {
      return jsonOk(req, { error: "Candidate profile not found. Please complete onboarding first." });
    }

    // Prevent duplicate upgrades
    if (candidate.access_level !== "generic") {
      return jsonOk(req, { error: "You already have an active subscription. No upgrade needed." });
    }

    // Create Razorpay order
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys missing from environment");
      return jsonOk(req, { error: "Payment configuration error. Please contact support." });
    }

    const amount = 4999; // ₹4,999
    const receipt_id = crypto.randomUUID().substring(0, 40);
    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    console.log(`Creating upgrade order for candidate ${candidate.id} | amount: ${amount}`);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: receipt_id,
        notes: {
          candidate_id: candidate.id,
          candidate_email: candidate.email,
          candidate_name: candidate.name,
          upgrade_type: "materials_only",
        },
      }),
    });

    const razorpayData = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      const rpError = razorpayData?.error?.description || razorpayData?.error?.code || JSON.stringify(razorpayData);
      console.error("Razorpay order creation failed:", JSON.stringify(razorpayData));
      return jsonOk(req, { error: `Payment gateway error: ${rpError}` });
    }

    const order_id = razorpayData.id;
    console.log(`Upgrade order created: ${order_id} for candidate: ${candidate.id}`);

    return jsonOk(req, {
      order_id,
      amount: razorpayData.amount,
      key_id: RAZORPAY_KEY_ID,
      candidate_id: candidate.id,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Unhandled exception in create-upgrade-order:", message);
    return jsonOk(req, { error: `Server error: ${message}` });
  }
});
