import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()

  let email = ''
  let password = ''
  try {
    const formData = await request.formData()
    email = formData.get('email')?.toString() || ''
    password = formData.get('password')?.toString() || ''
  } catch {
    // Fallback for non-multipart/form-data clients
    const text = await request.text()
    const params = new URLSearchParams(text)
    email = params.get('email') || ''
    password = params.get('password') || ''
  }

  console.log('[signin] attempt', email, 'password length', password.length)

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
