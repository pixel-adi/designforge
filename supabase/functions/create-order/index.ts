import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Only allow requests from your own domain (and localhost for dev)
const ALLOWED_ORIGINS = [
  "https://www.designforge.co.in",
  "https://designforge.co.in",
  "http://localhost:5173",
  "http://localhost:3000",
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

const jsonOk = (req: Request, data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });

function sanitizePhone(raw: string): { digits: string; error?: string } {
  if (!raw) return { digits: "", error: "Phone number is required" };
  let cleaned = raw.toString().replace(/[\s\-().]/g, "");
  cleaned = cleaned.replace(/^\+/, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return { digits: digits.slice(2) };
  if (digits.length === 11 && digits.startsWith("0")) return { digits: digits.slice(1) };
  if (digits.length !== 10) {
    return { digits, error: `Phone must be 10 digits. Got ${digits.length}: "${digits}"` };
  }
  return { digits };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const body = await req.json();
    const { formData, paymentType } = body;

    if (!formData || !paymentType) {
      return jsonOk(req, { error: "Missing required fields (formData or paymentType)" });
    }

    const name    = (formData.name    || "").toString().trim();
    const email   = (formData.email   || "").toString().trim().toLowerCase();
    const program = (formData.program || "").toString().trim();
    const stage   = (formData.stage   || "").toString().trim();

    if (!name || !email || !formData.phone || !paymentType) {
      return jsonOk(req, { error: "Missing required fields: name, email, phone, or paymentType" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonOk(req, { error: "Invalid email address format" });
    }

    const { digits: phone, error: phoneError } = sanitizePhone(formData.phone);
    if (phoneError) {
      console.error("Phone sanitization failed:", phoneError);
      return jsonOk(req, { error: `Invalid phone number: ${phoneError}` });
    }

    const PRICES: Record<string, number> = { full: 20000, installment: 12000 };
    const amount = PRICES[paymentType];
    if (!amount) {
      return jsonOk(req, { error: `Invalid payment type: "${paymentType}"` });
    }

    const RAZORPAY_KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys missing from environment");
      return jsonOk(req, { error: "Payment configuration error. Please contact support." });
    }

    const receipt_id = crypto.randomUUID().substring(0, 40);
    const basicAuth  = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    console.log(`Creating Razorpay order | amount: ${amount}`);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount:   Math.round(amount * 100),
        currency: "INR",
        receipt:  receipt_id,
        notes: { customer_name: name, customer_email: email, customer_phone: phone },
      }),
    });

    const razorpayData = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      const rpError = razorpayData?.error?.description || razorpayData?.error?.code || JSON.stringify(razorpayData);
      console.error("Razorpay order creation failed:", JSON.stringify(razorpayData));
      return jsonOk(req, { error: `Payment gateway error: ${rpError}` });
    }

    const order_id = razorpayData.id;
    console.log(`Razorpay order created: ${order_id}`);

    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase           = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from("registrations")
      .insert({ name, email, phone, program, stage, payment_status: "pending", payment_id: order_id, order_amount: amount });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return jsonOk(req, { error: `Registration save failed: ${dbError.message || "database error"}` });
    }

    return jsonOk(req, { order_id, amount: razorpayData.amount, key_id: RAZORPAY_KEY_ID });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Unhandled exception in create-order:", message);
    return jsonOk(req, { error: `Server error: ${message}` });
  }
});
