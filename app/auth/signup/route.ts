import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json()

  console.log('[signup] attempt', email)

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

  // 1. Check if profile already exists
  const { data: existingProfiles, error: profileLookupError } = await serviceSupabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (profileLookupError) {
    console.error('[signup] profile lookup error', profileLookupError.message)
  }

  if (existingProfiles) {
    console.log('[signup] profile exists', existingProfiles.id, 'approved=', existingProfiles.approved)
    if (existingProfiles.approved) {
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

  // 2. Try to create auth user
  let userId: string | null = null

  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || '' },
  })

  if (authData?.user) {
    userId = authData.user.id
    console.log('[signup] created auth user', userId)
  } else if (authError) {
    console.error('[signup] createUser error', authError.message)
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
      return NextResponse.json(
        { error: authError.message || 'Не удалось создать пользователя' },
        { status: 400 }
      )
    }
    userId = existingUser.id
    console.log('[signup] found existing auth user', userId)
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

  console.log('[signup] created profile', userId)
  return NextResponse.json({ success: true, pendingApproval: true })
}
