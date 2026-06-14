import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

/**
 * Compute rolling expiry: April 30 of the next applicable year.
 * - If current month is May–December → April 30 of next year
 * - If current month is January–April → April 30 of current year
 */
function computeAccessExpiry(): Date {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0=Jan, 3=Apr, 4=May)
  const expiryYear = currentMonth >= 4 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(Date.UTC(expiryYear, 3, 30, 23, 59, 59)); // April 30, 23:59:59 UTC
}

Deno.serve(async (req) => {
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

    // =========================================
    // Path A: Server-to-Server Webhook
    // =========================================
    if (signatureHeader) {
      const bodyText = await req.text();
      const expectedWebhookSig = await hmacSha256(RAZORPAY_KEY_SECRET, bodyText);

      if (expectedWebhookSig !== signatureHeader) {
        console.error("Webhook signature mismatch");
        return jsonOk(req, { error: "Invalid webhook signature" }, 403);
      }

      const payload = JSON.parse(bodyText);
      if (payload.event === 'order.paid' || payload.event === 'payment.captured') {
        const notes = payload.payload?.payment?.entity?.notes || payload.payload?.order?.entity?.notes;
        const candidate_id = notes?.candidate_id;
        const order_id = payload.payload?.payment?.entity?.order_id;

        if (candidate_id && order_id) {
          const expires_at = computeAccessExpiry();

          const { error: updateError } = await supabase
            .from("exam_candidates")
            .update({
              access_level: "materials_only",
              access_expires_at: expires_at.toISOString(),
              access_payment_id: order_id,
            })
            .eq("id", candidate_id);

          if (updateError) console.error("Webhook DB Update Error:", updateError);
          else console.log(`Webhook: upgraded candidate ${candidate_id} to materials_only, expires ${expires_at.toISOString()}`);
        }
      }
      return jsonOk(req, { status: "webhook received" });
    }

    // =========================================
    // Path B: Client-side Verification
    // =========================================
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonOk(req, { error: "Missing Razorpay verification payload" });
    }

    // Verify HMAC signature
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, signaturePayload);

    if (expectedSignature !== razorpay_signature) {
      console.error("Razorpay signature mismatch");
      return jsonOk(req, { error: "Invalid payment signature" }, 403);
    }

    // Extract user from JWT
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Compute rolling expiry
    const expires_at = computeAccessExpiry();

    // Build update filter — prefer auth-based, fall back to order-id-based
    let updateQuery;
    if (userId) {
      updateQuery = supabase
        .from("exam_candidates")
        .update({
          access_level: "materials_only",
          access_expires_at: expires_at.toISOString(),
          access_payment_id: razorpay_order_id,
        })
        .eq("auth_user_id", userId);
    } else {
      // Fallback: find by payment order in Razorpay notes (less reliable)
      console.warn("No auth token provided, upgrade may not apply correctly");
      return jsonOk(req, { error: "Authorization required for upgrade verification" }, 401);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error("Database update error:", updateError);
      return jsonOk(req, { error: "Failed to update access level in database" });
    }

    console.log(`Payment verified & access upgraded: ${razorpay_order_id}, user: ${userId}, expires: ${expires_at.toISOString()}`);
    return jsonOk(req, {
      status: "success",
      access_level: "materials_only",
      access_expires_at: expires_at.toISOString(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verification processing error:", message);
    return jsonOk(req, { error: `Server error: ${message}` });
  }
});
