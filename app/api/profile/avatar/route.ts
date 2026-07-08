import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage.from('chat-files').upload(path, file)

  if (error) {
    console.error('[avatar upload] error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrlData.publicUrl })
}
