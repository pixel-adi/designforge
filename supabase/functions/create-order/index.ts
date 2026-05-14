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
    const { formData, paymentType } = await req.json();

    // Validate required fields
    if (!formData || !formData.name || !formData.email || !formData.phone || !paymentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Calculate pricing securely on the backend instead of trusting the client
    const ONE_TIME_PRICE = 20000;
    const INSTALLMENT_FIRST = 12000;
    
    let amount = 0;
    if (paymentType === 'full') {
      amount = ONE_TIME_PRICE;
    } else if (paymentType === 'installment') {
      amount = INSTALLMENT_FIRST;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payment type" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Payment configuration error (Razorpay keys missing)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a receipt ID to use for the order creation
    const receipt_id = crypto.randomUUID().substring(0, 40);

    // Razorpay uses Basic Auth: base64(key_id:key_secret)
    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Create order with Razorpay
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // amount in paise
        currency: "INR",
        receipt: receipt_id, // max length 40
        notes: {
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
        }
      }),
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay error:", razorpayData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order", details: razorpayData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order_id = razorpayData.id;

    // Backend phone sanitization just to be doubly safe
    const safePhone = formData.phone ? formData.phone.replace(/\D/g, "") : "";

    // Insert the registration into Supabase using the Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from("registrations")
      .insert({
        name: formData.name,
        email: formData.email,
        phone: safePhone,
        program: formData.program,
        stage: formData.stage,
        payment_status: "pending",
        payment_id: order_id,
        order_amount: amount
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      return new Response(
        JSON.stringify({ error: `Registration failed: ${dbError.message || dbError.details || "Database error"}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        order_id: order_id,
        amount: razorpayData.amount, // returning paise amount back to frontend
        key_id: RAZORPAY_KEY_ID // send key_id to frontend so we don't need it in VITE env vars
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
