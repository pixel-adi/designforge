import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Convert ArrayBuffer to Hex String
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Configuration error (Razorpay secret missing)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signatureHeader = req.headers.get('x-razorpay-signature');
    
    // Path A: Server-to-Server Webhook (Guarantees data integrity if browser closes)
    if (signatureHeader) {
      const bodyText = await req.text();
      const expectedWebhookSig = await hmacSha256(RAZORPAY_KEY_SECRET, bodyText);
      
      if (expectedWebhookSig !== signatureHeader) {
        console.error("Webhook signature mismatch", { expected: expectedWebhookSig, received: signatureHeader });
        return new Response("Invalid webhook signature", { status: 400 });
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
        }
      }
      return new Response(JSON.stringify({ status: "webhook received" }), { status: 200, headers: corsHeaders });
    }

    // Path B: Client-side Verification (Instant UI feedback)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing Razorpay verification payload" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Razorpay signature: HMAC_HEX(secret, order_id + "|" + payment_id)
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, signaturePayload);

    if (expectedSignature !== razorpay_signature) {
      console.error("Razorpay signature mismatch", { expected: expectedSignature, received: razorpay_signature });
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: "paid" })
      .eq("payment_id", razorpay_order_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update payment status in database" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Razorpay Payment Verified via Frontend: ${razorpay_order_id}`);

    return new Response(
      JSON.stringify({ status: "success" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verification processing error:", message);
    return new Response(
      JSON.stringify({ error: `Server error: ${message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
