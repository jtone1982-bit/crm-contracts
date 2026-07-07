import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json()

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 1. Check if profile already exists and its approval status
  const { data: existingProfiles } = await serviceSupabase
    .from('profiles')
    .select('*')
    .eq('email', email)

  if (existingProfiles && existingProfiles.length > 0) {
    const profile = existingProfiles[0]
    if (profile.approved) {
      return NextResponse.json(
        { error: 'Аккаунт уже существует. Войдите.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Заявка на рассмотрении. Дождитесь одобрения администратора.' },
      { status: 409 }
    )
  }

  // 2. Try to create auth user. If email exists, fetch that user and create profile only.
  let userId: string | null = null

  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || '' },
  })

  if (authData?.user) {
    userId = authData.user.id
  } else if (authError) {
    // If user already registered, try to find by email
    const { data: userList, error: listError } = await serviceSupabase.auth.admin.listUsers()
    if (listError) {
      console.error('[signup] listUsers error', listError.message)
      return NextResponse.json(
        { error: 'Не удалось проверить существующего пользователя' },
        { status: 500 }
      )
    }
    const existingUser = userList.users.find((u) => u.email === email)
    if (!existingUser) {
      console.error('[signup] createUser error', authError.message)
      return NextResponse.json(
        { error: authError.message || 'Не удалось создать пользователя' },
        { status: 400 }
      )
    }
    userId = existingUser.id
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'Не удалось определить пользователя' },
      { status: 500 }
    )
  }

  // 3. Create profile
  const { error: profileError } = await serviceSupabase.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName || '',
    role: 'manager',
    approved: false,
    active: false,
  })

  if (profileError) {
    console.error('[signup] profile insert error', profileError.message)
    return NextResponse.json(
      { error: 'Не удалось сохранить профиль' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, pendingApproval: true })
}
