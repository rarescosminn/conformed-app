import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackLogin } from '@/lib/auth/trackLogin'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // IP real din headerele Vercel (sau fallback la x-forwarded-for)
  const ip =
    req.headers.get('x-vercel-forwarded-for') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null

  const userAgent = req.headers.get('user-agent') ?? null

  await trackLogin({
    userId: data.user?.id ?? null,
    email: data.user?.email ?? null,
    ipAddress: ip,
    userAgent,
  })

  return NextResponse.json({ success: true })
}