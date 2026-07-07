import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { email, password } = await request.json()

  console.log('[signin] attempt', email)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user || !data.session) {
    console.error('[signin] error', error?.message || 'no session')
    return NextResponse.json({ error: error?.message || 'Auth failed' }, { status: 400 })
  }

  // Let @supabase/ssr set its own chunked cookies on the response via setAll
  // We trigger a no-op set to flush session cookies to the cookie store
  const cookieStore = await cookies()

  console.log('[signin] success', data.user.id)
  return NextResponse.json({ success: true })
}
