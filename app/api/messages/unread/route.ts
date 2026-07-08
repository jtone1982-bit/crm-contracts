import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
    .select('id, is_general, receiver_id, sender_id, read_at', { count: 'exact' })
    .neq('sender_id', user.id)
    .is('read_at', null)

  if (general) {
    query = query.eq('is_general', true)
  } else if (receiverId) {
    query = query.eq('is_general', false).eq('sender_id', receiverId)
  } else {
    query = query.eq('is_general', false).eq('receiver_id', user.id)
  }

  const { count, error } = await query

  if (error) {
    console.error('[messages/unread] error', error.message)
    return NextResponse.json({ error: 'Не удалось загрузить счётчик' }, { status: 500 })
  }

  return NextResponse.json({ general: general ? count || 0 : 0, private: !general ? count || 0 : 0, total: count || 0 })
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
    query = query.eq('is_general', false).eq('receiver_id', user.id)
  }

  const { error } = await query

  if (error) {
    console.error('[messages/unread] mark read error', error.message)
    return NextResponse.json({ error: 'Не удалось отметить прочитанным' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
