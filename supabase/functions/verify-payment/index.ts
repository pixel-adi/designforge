import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp",
};

// HMAC-SHA256 using Web Crypto API (built into Deno, no external deps)
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
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!CASHFREE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const receivedSignature = req.headers.get("x-webhook-signature") || "";

    // Verify webhook signature
    const signaturePayload = timestamp + rawBody;
    const expectedSignature = await hmacSha256(CASHFREE_SECRET_KEY, signaturePayload);

    if (receivedSignature !== expectedSignature) {
      console.error("Webhook signature mismatch");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookData = JSON.parse(rawBody);
    const { data } = webhookData;

    if (!data || !data.order || !data.order.order_id) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = data.order.order_id;
    const orderStatus = data.order.order_status;

    // Map Cashfree status to our status
    let paymentStatus = "pending";
    if (orderStatus === "PAID") {
      paymentStatus = "paid";
    } else if (orderStatus === "EXPIRED" || orderStatus === "CANCELLED" || orderStatus === "VOID") {
      paymentStatus = "failed";
    }

    // Update registration in Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: paymentStatus })
      .eq("payment_id", orderId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update payment status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Payment ${orderId}: ${paymentStatus}`);

    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
