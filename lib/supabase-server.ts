import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const allCookies = cookieStore.getAll()
  const accessToken = allCookies.find((c) => c.name === 'sb-access-token')?.value
  const refreshToken = allCookies.find((c) => c.name === 'sb-refresh-token')?.value

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (name === 'sb-access-token' || name === 'sb-refresh-token') {
                cookieStore.set(name, value, { ...options, httpOnly: false, sameSite: 'lax' })
              } else {
                cookieStore.set(name, value, options)
              }
            })
          } catch {
            // The `setAll` method may throw in a read-only context
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  )
}
