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

    // Decode JWT to get caller's identity
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return jsonOk(req, { error: "Missing authorization token" }, 401);
    }

    let callerUid = "";
    let callerEmail = "";
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      callerUid = payload.sub || "";
      callerEmail = (payload.email || "").toLowerCase();
      console.log("Caller:", callerEmail, "| UID:", callerUid);
    } catch {
      return jsonOk(req, { error: "Invalid token format" }, 401);
    }

    if (!callerUid) {
      return jsonOk(req, { error: "Invalid token: missing user ID" }, 401);
    }

    // Verify caller is admin
    const { data: staffCheck, error: staffError } = await supabase
      .from("staff_users")
      .select("role")
      .eq("auth_user_id", callerUid)
      .maybeSingle();

    const isCallerAdmin = 
      callerEmail.endsWith("@designforge.co.in") || 
      (staffCheck && staffCheck.role === "admin");

    if (!isCallerAdmin) {
      return jsonOk(req, { error: "Access Denied: Only administrators can delete staff accounts." }, 403);
    }

    const body = await req.json();
    const { id } = body; // The ID of the row in public.staff_users

    if (!id) {
      return jsonOk(req, { error: "Missing required parameter: id" }, 400);
    }

    // Fetch the target staff user details
    const { data: targetStaff, error: fetchError } = await supabase
      .from("staff_users")
      .select("auth_user_id, email")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !targetStaff) {
      return jsonOk(req, { error: "Staff user not found" }, 404);
    }

    // SECURITY: Prevent self-deletion
    if (targetStaff.auth_user_id === callerUid) {
      return jsonOk(req, { error: "You cannot delete your own administrator account." }, 400);
    }

    // 1. Delete from Supabase Auth (cascades or cleans up auth.users)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(targetStaff.auth_user_id);
    if (deleteAuthError) {
      console.error("Auth user deletion failed:", deleteAuthError);
      return jsonOk(req, { error: `Authentication account deletion failed: ${deleteAuthError.message}` }, 500);
    }

    // 2. Delete from public.staff_users (in case cascade did not catch it or as confirmation)
    const { error: dbDeleteError } = await supabase
      .from("staff_users")
      .delete()
      .eq("id", id);

    if (dbDeleteError) {
      console.warn("Database row deletion warning:", dbDeleteError.message);
    }

    console.log(`Administrator ${callerEmail} deleted staff user account ${targetStaff.email}`);
    return jsonOk(req, { status: "success" });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in delete-staff-user:", message);
    return jsonOk(req, { error: `Server error: ${message}` }, 500);
  }
});
