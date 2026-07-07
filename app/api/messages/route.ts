import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

async function loadProfiles(supabase: Awaited<ReturnType<typeof createClient>>, messages: any[]) {
  const userIds = new Set<string>()
  messages.forEach((m) => {
    if (m.sender_id) userIds.add(m.sender_id)
    if (m.receiver_id) userIds.add(m.receiver_id)
  })

  if (userIds.size === 0) return new Map<string, { full_name: string | null; last_active_at: string | null }>()

  const ids = Array.from(userIds)

  let profiles: any
  let error: any

  const firstQuery = await (supabase
    .from('profiles')
    .select('id, full_name, last_active_at')
    .in('id', ids) as any)

  profiles = firstQuery.data
  error = firstQuery.error

  if (error?.message?.includes('last_active_at')) {
    const fallback = await (supabase.from('profiles').select('id, full_name').in('id', ids) as any)
    profiles = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('[messages] loadProfiles error', error.message)
    return new Map<string, { full_name: string | null; last_active_at: string | null }>()
  }

  return new Map<string, { full_name: string | null; last_active_at: string | null }>(
    (profiles || []).map((p: any) => [p.id, { full_name: p.full_name ?? null, last_active_at: p.last_active_at ?? null }])
  )
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

  const enriched = messages.map((m: any) => {
    const senderProfile = m.sender_id ? profileMap.get(m.sender_id) : null
    const receiverProfile = m.receiver_id ? profileMap.get(m.receiver_id) : null
    return {
      ...m,
      sender: m.sender_id
        ? { id: m.sender_id, full_name: (senderProfile as any)?.full_name || null, last_active_at: (senderProfile as any)?.last_active_at || null }
        : null,
      receiver: m.receiver_id
        ? { id: m.receiver_id, full_name: (receiverProfile as any)?.full_name || null, last_active_at: (receiverProfile as any)?.last_active_at || null }
        : null,
    }
  })

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
  const { content, receiverId, isGeneral, attachmentUrl } = body

  if (!content?.trim() && !attachmentUrl?.trim()) {
    return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 })
  }

  const { data, error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: isGeneral ? null : receiverId || null,
    content: content?.trim() || 'Голосовое сообщение',
    is_general: !!isGeneral,
    attachment_url: attachmentUrl?.trim() || null,
  }).select().single()

  if (error) {
    console.error('[messages] insert error', error.message)
    return NextResponse.json({ error: 'Не удалось отправить сообщение' }, { status: 500 })
  }

  const profileMap = await loadProfiles(supabase, [data])
  const senderProfile = data.sender_id ? profileMap.get(data.sender_id) : null
  const receiverProfile = data.receiver_id ? profileMap.get(data.receiver_id) : null
  const enriched = {
    ...data,
    sender: data.sender_id
      ? { id: data.sender_id, full_name: (senderProfile as any)?.full_name || null, last_active_at: (senderProfile as any)?.last_active_at || null }
      : null,
    receiver: data.receiver_id
      ? {
          id: data.receiver_id,
          full_name: (receiverProfile as any)?.full_name || null,
          last_active_at: (receiverProfile as any)?.last_active_at || null,
        }
      : null,
  }

  return NextResponse.json({ message: enriched })
}
