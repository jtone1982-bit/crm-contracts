import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()
  const email = formData.get('email')?.toString() || ''
  const password = formData.get('password')?.toString() || ''

  console.log('[signin] attempt', email)

  if (!email || !password) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Email и пароль обязательны'), request.url)
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user || !data.session) {
    console.error('[signin] error', error?.message || 'no session')
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent(error?.message || 'Ошибка входа'), request.url)
    )
  }

  console.log('[signin] success', data.user.id)
  return NextResponse.redirect(new URL('/', request.url))
}
