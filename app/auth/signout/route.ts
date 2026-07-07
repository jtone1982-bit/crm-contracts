import { createClient, AUTH_COOKIE } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Remove chunked auth cookies
  cookieStore.set(AUTH_COOKIE, '', { path: '/', maxAge: -1 })
  for (let i = 0; i < 10; i++) {
    cookieStore.set(`${AUTH_COOKIE}.${i}`, '', { path: '/', maxAge: -1 })
  }

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://tone-crm.ru'), 303)
}
