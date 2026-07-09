import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  const formData = await request.formData()

  const email = formData.get('email')?.toString() || ''
  const password = formData.get('password')?.toString() || ''
  const fullName = formData.get('fullName')?.toString() || ''
  const mode = formData.get('mode')?.toString() || 'login'

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('Email и пароль обязательны'), request.url))
  }

  if (mode === 'signup') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error.message) + '&mode=signup', request.url))
    }
    return NextResponse.redirect(new URL('/pending', request.url))
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error?.message || 'Ошибка входа'), request.url))
  }

  // Supabase SSR автоматически ставит свои chunked cookies.
  // Дополнительно проставляем legacy cookie для надежности.
  cookieStore.set('sb-token', data.session.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.redirect(new URL('/', request.url))
}
