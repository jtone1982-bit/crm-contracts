import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[news] get error', error.message)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }

  return NextResponse.json({ news: data || [] })
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Только админ может публиковать новости' }, { status: 403 })
  }

  const body = await request.json()
  const { title, content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Содержание новости обязательно' }, { status: 400 })
  }

  const { data, error } = await supabase.from('news').insert({
    title: title || null,
    content: content.trim(),
    created_by: user.id,
  }).select().single()

  if (error) {
    console.error('[news] insert error', error.message)
    return NextResponse.json({ error: 'Не удалось опубликовать новость' }, { status: 500 })
  }

  return NextResponse.json({ news: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Только админ может удалять новости' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID новости не указан' }, { status: 400 })
  }

  const { error } = await supabase.from('news').delete().eq('id', id)

  if (error) {
    console.error('[news] delete error', error.message)
    return NextResponse.json({ error: 'Не удалось удалить новость' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
