import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()

  let email = ''
  let password = ''
  let mode = 'login'
  let fullName = ''

  // Read body once, parse based on content type
  const contentType = request.headers.get('content-type') || ''
  const bodyText = await request.text()

  if (contentType.includes('application/json')) {
    try {
      const json = JSON.parse(bodyText)
      email = json.email || ''
      password = json.password || ''
      mode = json.mode || 'login'
      fullName = json.fullName || ''
    } catch {}
  } else {
    // form-urlencoded or multipart — use URLSearchParams on raw text
    const params = new URLSearchParams(bodyText)
    email = params.get('email') || ''
    password = params.get('password') || ''
    mode = params.get('mode') || 'login'
    fullName = params.get('fullName') || ''
  }

  console.log('[signin] attempt', email, 'password length', password.length)

  // Build base URL from forwarded headers (Cloudflare → Nginx → Next.js)
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'tone-crm.ru'
  const baseUrl = `${proto}://${host}`

  if (!email || !password) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Email и пароль обязательны'), baseUrl)
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user || !data.session) {
    console.error('[signin] error', error?.message || 'no session')
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent(error?.message || 'Ошибка входа'), baseUrl)
    )
  }

  console.log('[signin] success', data.user.id)
  return NextResponse.redirect(new URL('/', baseUrl))
}
