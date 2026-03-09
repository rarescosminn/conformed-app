import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
)

async function getLocation(ip: string | null): Promise<{ city: string | null; country: string | null }> {
  if (!ip) return { city: null, country: null }
  try {
    const token = process.env.IPINFO_TOKEN
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`)
    if (!res.ok) return { city: null, country: null }
    const data = await res.json()
    return {
      city: data.city ?? null,
      country: data.country ?? null,
    }
  } catch {
    return { city: null, country: null }
  }
}

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
  const { city, country } = await getLocation(ipAddress)

  const { error } = await supabaseAdmin.from('login_events').insert({
    user_id: userId,
    email,
    ip_address: ipAddress,
    user_agent: userAgent,
    city,
    country,
  })

  if (error) {
    console.error('[trackLogin] eroare:', error.message)
  }
}