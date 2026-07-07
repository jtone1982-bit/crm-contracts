import { createClient, createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Не указан путь' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('chat-files')
    .createSignedUrl(path, 60 * 60 * 24)

  if (error) {
    console.error('[download] error', error.message)
    return NextResponse.json({ error: 'Не удалось получить ссылку' }, { status: 500 })
  }

  return NextResponse.json({ url: (data as any).signedUrl })
}
