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

    // Verify caller has administrator privileges
    const { data: staffCheck, error: staffError } = await supabase
      .from("staff_users")
      .select("role")
      .eq("auth_user_id", callerUid)
      .maybeSingle();

    const isCallerAdmin = 
      callerEmail.endsWith("@designforge.co.in") || 
      (staffCheck && staffCheck.role === "admin");

    if (!isCallerAdmin) {
      console.error(`Unauthorized staff creation attempt: ${callerEmail} tried to create a user`);
      return jsonOk(req, { error: "Access Denied: Only administrators can create staff accounts." }, 403);
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return jsonOk(req, { error: "Missing required fields: name, email, password, and role are required." }, 400);
    }

    if (!["admin", "sme", "mentor"].includes(role)) {
      return jsonOk(req, { error: "Invalid role. Role must be admin, sme, or mentor." }, 400);
    }

    // 1. Create auth user in Supabase Auth using admin API
    const { data: newUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createAuthError || !newUser.user) {
      console.error("Auth user creation failed:", createAuthError);
      return jsonOk(req, { error: `Authentication account creation failed: ${createAuthError?.message || "Unknown error"}` }, 400);
    }

    // 2. Provision staff profile in public.staff_users
    const { error: dbError } = await supabase
      .from("staff_users")
      .insert({
        auth_user_id: newUser.user.id,
        name,
        email: email.toLowerCase(),
        role
      });

    if (dbError) {
      console.error("Database staff entry creation failed. Rolling back auth user:", dbError);
      // Rollback Auth creation if DB insert fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return jsonOk(req, { error: `Database profile creation failed: ${dbError.message}` }, 500);
    }

    console.log(`Administrator ${callerEmail} created staff user ${email} with role ${role}`);
    return jsonOk(req, { status: "success", user_id: newUser.user.id });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in create-staff-user:", message);
    return jsonOk(req, { error: `Server error: ${message}` }, 500);
  }
});
