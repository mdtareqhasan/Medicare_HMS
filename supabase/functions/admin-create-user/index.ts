import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check role - allow admin, doctor, and nurse
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const allowedRoles = ["admin", "doctor", "nurse"];
    let hasAccess = false;

    for (const r of allowedRoles) {
      const { data } = await adminClient.rpc("has_role", { _user_id: callerId, _role: r });
      if (data) { hasAccess = true; break; }
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied. Admin, doctor, or nurse role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      email, password, full_name, role, phone, gender,
      specialization, degrees, education, experience_years,
      experience_details, address,
    } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Email, password, and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update role if not patient (trigger creates default patient role)
    if (role !== "patient") {
      await adminClient
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUser.user!.id);
    }

    // Update profile with all info
    const profileUpdate: Record<string, unknown> = {};
    if (phone) profileUpdate.phone = phone;
    if (gender) profileUpdate.gender = gender;
    if (specialization) profileUpdate.specialization = specialization;
    if (degrees) profileUpdate.degrees = degrees;
    if (education) profileUpdate.education = education;
    if (experience_years != null) profileUpdate.experience_years = experience_years;
    if (experience_details) profileUpdate.experience_details = experience_details;
    if (address) profileUpdate.address = address;

    if (Object.keys(profileUpdate).length > 0) {
      await adminClient
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", newUser.user!.id);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user!.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
