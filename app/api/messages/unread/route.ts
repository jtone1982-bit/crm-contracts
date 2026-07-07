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
    .from('messages')
    .select('id, is_general, receiver_id')
    .neq('sender_id', user.id)
    .is('read_at', null)
    .or(`is_general.eq.true,receiver_id.eq.${user.id}`)

  if (error) {
    console.error('[messages/unread] error', error.message)
    return NextResponse.json({ error: 'Не удалось загрузить счётчик' }, { status: 500 })
  }

  const general = data?.filter((m) => m.is_general).length || 0
  const private_ = data?.filter((m) => !m.is_general).length || 0

  return NextResponse.json({ general, private: private_, total: general + private_ })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const general = searchParams.get('general') === 'true'
  const receiverId = searchParams.get('receiverId')

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let query = supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .neq('sender_id', user.id)
    .is('read_at', null)

  if (general) {
    query = query.eq('is_general', true)
  } else if (receiverId) {
    query = query.eq('is_general', false).eq('sender_id', receiverId)
  } else {
    query = query.or(`is_general.eq.true,receiver_id.eq.${user.id}`)
  }

  const { error } = await query

  if (error) {
    console.error('[messages/unread] mark read error', error.message)
    return NextResponse.json({ error: 'Не удалось отметить прочитанным' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
