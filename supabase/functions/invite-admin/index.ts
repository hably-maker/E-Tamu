import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email, fullName } = await req.json()

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY kosong" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
      data: { full_name: fullName?.trim() || email.trim() },
      redirectTo: `${Deno.env.get("APP_URL") || "http://localhost:5173"}/login`,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message || "Gagal mengundang" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    if (data?.user) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName?.trim() || email.trim() })
        .eq("id", data.user.id)
    }

    return new Response(
      JSON.stringify({ message: "Undangan berhasil dikirim", user: data.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengirim undangan"
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})