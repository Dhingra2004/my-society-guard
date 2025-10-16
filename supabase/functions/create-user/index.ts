import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing environment configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { email, password, role, fullName, phoneNumber, flatNumber } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "email, password and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["admin", "guard", "resident", "super_admin"] as const;
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if there is already a super admin
    const { count: superAdminsCount, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin");

    if (countErr) throw countErr;

    // Seed path: if no super_admin exists yet, allow creating ANY provided super_admin once
    if ((superAdminsCount || 0) === 0) {
      if (role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "First user must be super_admin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone: phoneNumber || undefined,
        phone_confirm: !!phoneNumber,
        user_metadata: {
          full_name: fullName || "Super Admin",
          phone_number: phoneNumber || "",
          flat_number: flatNumber || "",
          role: "super_admin",
        },
      });
      if (createErr) throw createErr;
      return new Response(
        JSON.stringify({ success: true, userId: created.user?.id, seeded: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Non-seed path: require authenticated caller with admin/super_admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const { data: authed, error: getUserErr } = await supabaseAdmin.auth.getUser(token);
    if (getUserErr || !authed?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = authed.user.id;
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    if (rolesErr) throw rolesErr;

    const callerRoles = (roles || []).map((r: any) => r.role);
    const isAdmin = callerRoles.includes("admin") || callerRoles.includes("super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the requested user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phoneNumber || undefined,
      phone_confirm: !!phoneNumber,
      user_metadata: {
        full_name: fullName || "",
        phone_number: phoneNumber || "",
        flat_number: flatNumber || "",
        role,
      },
    });

    if (createErr) throw createErr;

    return new Response(
      JSON.stringify({ success: true, userId: created.user?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});