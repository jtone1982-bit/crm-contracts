import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  return NextResponse.json({
    email: user.email,
    user_metadata: user.user_metadata || {},
  })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const body = await request.json()
  const { phone, additional_email, address, social_links, avatar_url, full_name } = body

  // Sync display name into profiles table for messenger and dashboard
  if (full_name) {
    await supabase.from('profiles').update({ full_name }).eq('id', user.id)
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      full_name: full_name ?? user.user_metadata?.full_name,
      phone: phone ?? user.user_metadata?.phone,
      additional_email: additional_email ?? user.user_metadata?.additional_email,
      address: address ?? user.user_metadata?.address,
      social_links: social_links ?? user.user_metadata?.social_links,
      avatar_url: avatar_url ?? user.user_metadata?.avatar_url,
    },
  })

  if (error) {
    console.error('[profile] update error', error.message)
    return NextResponse.json({ error: 'Не удалось обновить профиль' }, { status: 500 })
  }

  // Refresh session cookie so new metadata is available on next SSR
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    console.error('[profile] refresh error', refreshError.message)
  } else if (refreshData.session) {
    cookieStore.set('sb-qwwikbmvdwgaekxmekbe-auth-token', refreshData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    cookieStore.set('sb-qwwikbmvdwgaekxmekbe-auth-token-refresh', refreshData.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  return NextResponse.json({ success: true, user_metadata: data.user?.user_metadata })
}
