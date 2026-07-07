import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let data: any
  let error: any

  const firstQuery = await (supabase
    .from('profiles')
    .select('id, email, full_name, last_active_at')
    .neq('id', user.id)
    .order('full_name', { ascending: true }) as any)

  data = firstQuery.data
  error = firstQuery.error

  if (error?.message?.includes('last_active_at')) {
    const fallback = await (supabase
      .from('profiles')
      .select('id, email, full_name')
      .neq('id', user.id)
      .order('full_name', { ascending: true }) as any)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('[managers-list] error', error.message)
    return NextResponse.json({ error: 'Не удалось загрузить пользователей' }, { status: 500 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: userList, error: listError } = await serviceSupabase.auth.admin.listUsers()
  if (listError) {
    console.error('[managers-list] listUsers error', listError.message)
  }

  const signInMap = new Map((userList?.users || []).map((u) => [u.id, u.last_sign_in_at]))

  const enriched = (data || []).map((p: any) => ({
    ...p,
    last_sign_in_at: signInMap.get(p.id) || null,
  }))

  return NextResponse.json({ profiles: enriched })
}
