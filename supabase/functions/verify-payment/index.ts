import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// HMAC-SHA256 using Web Crypto API
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) {
      return jsonOk(req, { error: "Configuration error (Razorpay secret missing)" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signatureHeader = req.headers.get('x-razorpay-signature');

    // Path A: Server-to-Server Webhook (DB update even if browser closes)
    if (signatureHeader) {
      const bodyText = await req.text();
      const expectedWebhookSig = await hmacSha256(RAZORPAY_KEY_SECRET, bodyText);

      if (expectedWebhookSig !== signatureHeader) {
        console.error("Webhook signature mismatch");
        return jsonOk(req, { error: "Invalid webhook signature" });
      }

      const payload = JSON.parse(bodyText);
      if (payload.event === 'order.paid' || payload.event === 'payment.captured') {
        const order_id = payload.payload.payment.entity.order_id;
        if (order_id) {
          const { error: updateError } = await supabase
            .from("registrations")
            .update({ payment_status: "paid" })
            .eq("payment_id", order_id);
          if (updateError) console.error("Webhook DB Update Error:", updateError);
          else console.log(`Webhook: marked ${order_id} as paid`);
        }
      }
      return jsonOk(req, { status: "webhook received" });
    }

    // Path B: Client-side Verification (instant UI feedback)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonOk(req, { error: "Missing Razorpay verification payload" });
    }

    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, signaturePayload);

    if (expectedSignature !== razorpay_signature) {
      console.error("Razorpay signature mismatch");
      return jsonOk(req, { error: "Invalid payment signature" });
    }

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: "paid" })
      .eq("payment_id", razorpay_order_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return jsonOk(req, { error: "Failed to update payment status in database" });
    }

    console.log(`Payment verified: ${razorpay_order_id}`);
    return jsonOk(req, { status: "success" });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verification processing error:", message);
    return jsonOk(req, { error: `Server error: ${message}` });
  }
});
