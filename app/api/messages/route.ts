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
    .select(`
      *,
      sender:profiles!sender_id(id, full_name),
      receiver:profiles!receiver_id(id, full_name)
    `)
    .order('created_at', { ascending: true })

  if (general) {
    query = query.eq('is_general', true)
  } else if (receiverId) {
    query = query
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .eq('is_general', false)
  } else {
    query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).eq('is_general', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('[messages] get error', error.message)
    return NextResponse.json({ error: 'Не удалось загрузить сообщения' }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const body = await request.json()
  const { content, receiverId, isGeneral } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 })
  }

  const { data, error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: isGeneral ? null : receiverId || null,
    content: content.trim(),
    is_general: !!isGeneral,
  }).select(`
    *,
    sender:profiles!sender_id(id, full_name),
    receiver:profiles!receiver_id(id, full_name)
  `).single()

  if (error) {
    console.error('[messages] insert error', error.message)
    return NextResponse.json({ error: 'Не удалось отправить сообщение' }, { status: 500 })
  }

  return NextResponse.json({ message: data })
}
