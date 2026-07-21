// ============================================================================
// VELCARCARE CRM — Secure staff account creation (Supabase Edge Function)
// Only a Manager may call this. Uses the service-role key which stays server-side
// and is NEVER exposed to the browser bundle.
//
// Deploy:  supabase functions deploy create-staff
// Secrets: supabase secrets set SERVICE_ROLE_KEY=<service-role-key>
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    // 1) Verify the caller is an authenticated Manager.
    const authHeader = req.headers.get('Authorization') ?? ''
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await callerClient.auth.getUser()
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401)

    const { data: profile } = await callerClient
      .from('profiles')
      .select('role, status')
      .eq('id', userData.user.id)
      .single()
    if (profile?.role !== 'manager' || profile?.status !== 'active') {
      return json({ error: 'Only an active Manager can create staff.' }, 403)
    }

    // 2) Create the staff auth user + profile with the service role.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const body = await req.json()
    const { name, username, email, mobile, password, staff_id, permissions } = body

    if (!name || !username || !email || !password) {
      return json({ error: 'name, username, email and password are required.' }, 400)
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username },
    })
    if (createErr) return json({ error: createErr.message }, 400)

    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      staff_id,
      name,
      username,
      email,
      mobile,
      role: 'staff',
      status: 'active',
      permissions: permissions ?? {},
    })
    if (profileErr) {
      // Roll back the auth user if the profile insert fails.
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: profileErr.message }, 400)
    }

    return json({ ok: true, user_id: created.user.id, staff_id }, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
