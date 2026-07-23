import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const STUDENT_ONLY_PATHS = ['/training', '/profile', '/api/training', '/api/profile']
const PROTECTED_DASHBOARD_PATHS = ['/', '/candidates', '/calendar', '/messages', '/reports', '/tools', '/admin']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  const projectRef = url.hostname.split('.')[0]
  const authCookie = `sb-${projectRef}-auth-token`

  const token = request.cookies.get(authCookie)?.value
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/login')) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: authCookie },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isStudent = profile?.role === 'student'
  const pathname = request.nextUrl.pathname

  if (isStudent) {
    // Allow only training and profile
    const isAllowed = STUDENT_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|auth/signin|login|pending|.*\\..*).*)'],
}
