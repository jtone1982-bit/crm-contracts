import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { email, password } = await request.json()

  console.log('[signin] attempt', email)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    console.error('[signin] error', error?.message || 'no user')
    return NextResponse.json({ error: error?.message || 'Auth failed' }, { status: 400 })
  }

  if (!data.session) {
    console.error('[signin] no session')
    return NextResponse.json({ error: 'No session' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const maxAge = 60 * 60 * 24 * 365

  cookieStore.set('sb-access-token', data.session.access_token, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  })
  cookieStore.set('sb-refresh-token', data.session.refresh_token, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  })

  console.log('[signin] success', data.user.id)
  return NextResponse.json({ success: true })
}
