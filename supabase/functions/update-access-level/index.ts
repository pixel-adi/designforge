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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an admin by decoding JWT
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return jsonOk(req, { error: "Missing authorization token" }, 401);
    }

    // Decode JWT payload (token is already verified by Supabase API gateway)
    let callerEmail = "";
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      callerEmail = (payload.email || "").toLowerCase();
      console.log("Caller email from JWT:", callerEmail, "| Role:", payload.role);
    } catch {
      return jsonOk(req, { error: "Invalid token format" }, 401);
    }

    // STRICT admin check — only @designforge.co.in emails
    if (!callerEmail.endsWith("@designforge.co.in")) {
      console.error(`Non-admin attempted access update: ${callerEmail}`);
      return jsonOk(req, { error: "Unauthorized: Admin access required" }, 403);
    }

    const body = await req.json();
    const { candidate_id, access_level, access_expires_at } = body;

    if (!candidate_id) {
      return jsonOk(req, { error: "candidate_id is required" }, 400);
    }

    // Validate access_level
    const validLevels = ["generic", "materials_only", "focus_batch"];
    if (access_level && !validLevels.includes(access_level)) {
      return jsonOk(req, { error: `Invalid access_level. Must be one of: ${validLevels.join(", ")}` }, 400);
    }

    // Build the update payload
    const updateData: Record<string, unknown> = {};
    
    if (access_level !== undefined) {
      updateData.access_level = access_level;
    }

    if (access_level === "generic") {
      updateData.access_expires_at = null;
      updateData.access_payment_id = null;
    } else if (access_expires_at) {
      updateData.access_expires_at = access_expires_at;
    }

    if (Object.keys(updateData).length === 0) {
      return jsonOk(req, { error: "No fields to update" }, 400);
    }

    // Update using service role (bypasses RLS)
    const { data: updated, error: updateError } = await supabase
      .from("exam_candidates")
      .update(updateData)
      .eq("id", candidate_id)
      .select("id, access_level, access_expires_at")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return jsonOk(req, { error: `Database error: ${updateError.message}` }, 500);
    }

    console.log(`Admin ${callerEmail} updated candidate ${candidate_id}: ${JSON.stringify(updateData)}`);
    return jsonOk(req, { status: "success", candidate: updated });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in update-access-level:", message);
    return jsonOk(req, { error: `Server error: ${message}` }, 500);
  }
});
