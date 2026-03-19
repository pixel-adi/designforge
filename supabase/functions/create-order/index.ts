import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { registration_id, amount, customer_name, customer_email, customer_phone } = await req.json();

    // Validate required fields
    if (!registration_id || !amount || !customer_name || !customer_email || !customer_phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY");
    const CASHFREE_API_URL = Deno.env.get("CASHFREE_API_URL") || "https://api.cashfree.com";

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique order ID
    const order_id = `DF_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create order with Cashfree
    const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/pg/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        order_id,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: registration_id,
          customer_name,
          customer_email,
          customer_phone,
        },
        order_meta: {
          return_url: `${req.headers.get("origin") || "https://designforge.in"}/focus-batch?order_id=${order_id}&status={order_status}`,
        },
      }),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("Cashfree error:", cashfreeData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order", details: cashfreeData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update registration with the Cashfree order ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from("registrations")
      .update({ payment_id: order_id, order_amount: amount })
      .eq("id", registration_id);

    return new Response(
      JSON.stringify({
        payment_session_id: cashfreeData.payment_session_id,
        order_id: cashfreeData.cf_order_id,
        order_token: order_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
