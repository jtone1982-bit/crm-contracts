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

  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || '' },
  })

  if (authError || !authData.user) {
    console.error('[signup] error', authError?.message)
    return NextResponse.json(
      { error: authError?.message || 'Не удалось создать пользователя' },
      { status: 400 }
    )
  }

  const { error: profileError } = await serviceSupabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName || '',
    role: 'manager',
    approved: false,
    active: false,
  })

  if (profileError) {
    console.error('[signup] profile insert error', profileError.message)
    // Rollback user creation if profile failed
    await serviceSupabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json(
      { error: 'Не удалось сохранить профиль' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, pendingApproval: true })
}
