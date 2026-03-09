import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function trackLogin({
  userId,
  email,
  ipAddress,
  userAgent,
}: {
  userId: string | null
  email: string | null
  ipAddress: string | null
  userAgent: string | null
}) {
  const { error } = await supabaseAdmin.from('login_events').insert({
    user_id: userId,
    email,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (error) {
    console.error('[trackLogin] eroare:', error.message)
  }
}