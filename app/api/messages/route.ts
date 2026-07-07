import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

async function loadProfiles(supabase: Awaited<ReturnType<typeof createClient>>, messages: any[]) {
  const userIds = new Set<string>()
  messages.forEach((m) => {
    if (m.sender_id) userIds.add(m.sender_id)
    if (m.receiver_id) userIds.add(m.receiver_id)
  })

  if (userIds.size === 0) return new Map<string, string | null>()

  const ids = Array.from(userIds)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)

  if (error) {
    console.error('[messages] loadProfiles error', error.message)
    return new Map<string, string | null>()
  }

  return new Map((profiles || []).map((p: any) => [p.id, p.full_name]))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const general = searchParams.get('general') === 'true'
  const receiverId = searchParams.get('receiverId')
  const q = searchParams.get('q')?.trim().toLowerCase()

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let query = supabase.from('messages').select('*').order('created_at', { ascending: true })

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

  const messages = data || []
  const profileMap = await loadProfiles(supabase, messages)

  const enriched = messages.map((m) => ({
    ...m,
    sender: m.sender_id ? { id: m.sender_id, full_name: profileMap.get(m.sender_id) || null } : null,
    receiver: m.receiver_id ? { id: m.receiver_id, full_name: profileMap.get(m.receiver_id) || null } : null,
  }))

  if (q) {
    const filtered = enriched.filter((m) => {
      const senderName = m.sender?.full_name?.toLowerCase() || ''
      const content = m.content.toLowerCase()
      return content.includes(q) || senderName.includes(q)
    })
    return NextResponse.json({ messages: filtered })
  }

  return NextResponse.json({ messages: enriched })
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
  }).select().single()

  if (error) {
    console.error('[messages] insert error', error.message)
    return NextResponse.json({ error: 'Не удалось отправить сообщение' }, { status: 500 })
  }

  const profileMap = await loadProfiles(supabase, [data])
  const enriched = {
    ...data,
    sender: data.sender_id ? { id: data.sender_id, full_name: profileMap.get(data.sender_id) || null } : null,
    receiver: data.receiver_id ? { id: data.receiver_id, full_name: profileMap.get(data.receiver_id) || null } : null,
  }

  return NextResponse.json({ message: enriched })
}
