import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Always return HTTP 200 with a JSON body — Supabase JS client throws on non-2xx,
 *  making the real error invisible to the caller. We pass errors in the JSON body instead. */
const jsonOk = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Sanitize phone:
 * 1. Strip everything that isn't a digit or leading +
 * 2. Remove country code (91) if present at start → keep last 10 digits
 * 3. Validate it is exactly 10 digits
 */
function sanitizePhone(raw: string): { digits: string; error?: string } {
  if (!raw) return { digits: "", error: "Phone number is required" };

  // Strip spaces, dashes, parentheses, dots — keep digits and leading +
  let cleaned = raw.toString().replace(/[\s\-().]/g, "");

  // Remove any + prefix
  cleaned = cleaned.replace(/^\+/, "");

  // Strip non-digit chars
  const digits = cleaned.replace(/\D/g, "");

  // If 12 digits starting with 91 → Indian mobile with country code
  if (digits.length === 12 && digits.startsWith("91")) {
    return { digits: digits.slice(2) };
  }

  // If 11 digits starting with 0 → Indian mobile with trunk prefix
  if (digits.length === 11 && digits.startsWith("0")) {
    return { digits: digits.slice(1) };
  }

  // Must be exactly 10 digits
  if (digits.length !== 10) {
    return {
      digits,
      error: `Phone must be 10 digits. Got ${digits.length} digit(s): "${digits}"`,
    };
  }

  return { digits };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { formData, paymentType } = body;

    // --- Input validation ---
    if (!formData || !paymentType) {
      return jsonOk({ error: "Missing required fields (formData or paymentType)" });
    }

    // Trim all string inputs to avoid whitespace issues
    const name  = (formData.name  || "").toString().trim();
    const email = (formData.email || "").toString().trim().toLowerCase();
    const program = (formData.program || "").toString().trim();
    const stage   = (formData.stage   || "").toString().trim();

    if (!name || !email || !formData.phone || !paymentType) {
      return jsonOk({ error: "Missing required fields: name, email, phone, or paymentType" });
    }

    // --- Phone sanitization ---
    const { digits: phone, error: phoneError } = sanitizePhone(formData.phone);
    if (phoneError) {
      console.error("Phone sanitization failed:", phoneError, "| raw input:", formData.phone);
      return jsonOk({ error: `Invalid phone number: ${phoneError}` });
    }

    // --- Server-side pricing (never trust client) ---
    const PRICES: Record<string, number> = {
      full: 20000,
      installment: 12000,
    };
    const amount = PRICES[paymentType];
    if (!amount) {
      return jsonOk({ error: `Invalid payment type: "${paymentType}". Must be "full" or "installment"` });
    }

    // --- Razorpay keys ---
    const RAZORPAY_KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys missing from environment");
      return jsonOk({ error: "Payment configuration error. Please contact support." });
    }

    // --- Create Razorpay order ---
    const receipt_id = crypto.randomUUID().substring(0, 40);
    const basicAuth  = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    console.log(`Creating Razorpay order | amount: ${amount} | phone: ${phone} | email: ${email}`);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount:   Math.round(amount * 100), // paise
        currency: "INR",
        receipt:  receipt_id,
        notes: {
          customer_name:  name,
          customer_email: email,
          customer_phone: phone,
        },
      }),
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      // Surface the actual Razorpay error message
      const rpError = razorpayData?.error?.description
        || razorpayData?.error?.code
        || JSON.stringify(razorpayData);
      console.error("Razorpay order creation failed:", JSON.stringify(razorpayData));
      return jsonOk({ error: `Payment gateway error: ${rpError}` });
    }

    const order_id = razorpayData.id;
    console.log(`Razorpay order created: ${order_id}`);

    // --- Insert registration record ---
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase           = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from("registrations")
      .insert({
        name,
        email,
        phone,
        program,
        stage,
        payment_status: "pending",
        payment_id:     order_id,
        order_amount:   amount,
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return jsonOk({
        error: `Registration save failed: ${dbError.message || dbError.details || "database error"}`,
      });
    }

    return jsonOk({
      order_id,
      amount:  razorpayData.amount, // paise — frontend uses this
      key_id:  RAZORPAY_KEY_ID,
    });

  } catch (error) {
    // Always 200 so the client can read the JSON body
    const message = error instanceof Error ? error.message : String(error);
    console.error("Unhandled exception in create-order:", message);
    return jsonOk({ error: `Server error: ${message}` });
  }
});
