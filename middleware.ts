import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const STUDENT_ALLOWED_PATHS = ['/training', '/profile', '/api/training', '/api/profile']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files and auth pages
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/') ||
    pathname === '/pending'
  ) {
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({ request })

  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  const projectRef = url.hostname.split('.')[0]
  const authCookiePrefix = `sb-${projectRef}-auth-token`

  // Supabase SSR uses chunked cookies: sb-<ref>-auth-token-0, -1, etc.
  const allCookies = request.cookies.getAll()
  const authCookie = allCookies
    .filter((c) => c.name.startsWith(authCookiePrefix))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => c.value)
    .join('')

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: authCookiePrefix },
      cookies: {
        getAll() {
          return allCookies
        },
        setAll() {},
      },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    }
  )

  const { data: { user } } = await supabase.auth.getUser(authCookie)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isStudent = profile?.role === 'student'

  if (isStudent) {
    const isAllowed = STUDENT_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/training', request.url))
    }
  }

  if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
}
