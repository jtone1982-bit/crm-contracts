import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', '', { path: '/', maxAge: -1 })
  cookieStore.set('sb-refresh-token', '', { path: '/', maxAge: -1 })

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://tone-crm.ru'), 303)
}
