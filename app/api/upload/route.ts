import { createClient, createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

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
  const { contentType } = body

  if (!contentType?.startsWith('audio/')) {
    return NextResponse.json({ error: 'Разрешены только аудио файлы' }, { status: 400 })
  }

  const ext = contentType === 'audio/webm' ? 'webm' : contentType.split('/')[1] || 'webm'
  const path = `${user.id}/${randomUUID()}.${ext}`

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('chat-files')
    .createSignedUploadUrl(path)

  if (error) {
    console.error('[upload] error', error.message)
    return NextResponse.json({ error: 'Не удалось создать ссылку для загрузки' }, { status: 500 })
  }

  return NextResponse.json({ path, signedUrl: (data as any).signedUrl, token: (data as any).token })
}
