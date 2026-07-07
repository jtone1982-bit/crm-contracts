import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { email, password } = await request.json()

  console.log('[signin] attempt', email)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[signin] supabase error', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data.user) {
    console.error('[signin] no user returned')
    return NextResponse.json({ error: 'No user returned' }, { status: 400 })
  }

  console.log('[signin] success', data.user.id)
  return NextResponse.json({ success: true })
}
