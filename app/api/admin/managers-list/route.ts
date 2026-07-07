import { createClient } from '@/lib/supabase-server'
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

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .neq('id', user.id)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[managers-list] error', error.message)
    return NextResponse.json({ error: 'Не удалось загрузить пользователей' }, { status: 500 })
  }

  return NextResponse.json({ profiles: data || [] })
}
