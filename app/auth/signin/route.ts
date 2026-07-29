import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getProjectRef() {
  try {
    const url = new URL(SUPABASE_URL)
    return url.hostname.split('.')[0]
  } catch {
    return ''
  }
}

const AUTH_COOKIE = `sb-${getProjectRef()}-auth-token`

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  const bodyText = await request.text()

  let email = ''
  let password = ''

  if (contentType.includes('application/json')) {
    try {
      const json = JSON.parse(bodyText)
      email = json.email || ''
      password = json.password || ''
    } catch {}
  } else {
    const params = new URLSearchParams(bodyText)
    email = params.get('email') || ''
    password = params.get('password') || ''
  }

  console.log('[signin] attempt', email, 'password length', password.length)

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'tone-crm.ru'
  const baseUrl = `${proto}://${host}`

  if (!email || !password) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Email и пароль обязательны'), baseUrl)
    )
  }

  const cookieStore = await cookies()
  const cookiesToSet: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: { name: AUTH_COOKIE },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies)
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user || !data.session) {
    console.error('[signin] error', error?.message || 'no session')
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent(error?.message || 'Ошибка входа'), baseUrl)
    )
  }

  console.log('[signin] success', data.user.id)

  const response = NextResponse.redirect(new URL('/', baseUrl))
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
