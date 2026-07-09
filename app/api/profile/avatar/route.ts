import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Поддерживаются только JPG, PNG, WebP' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  // Use service role client to bypass storage RLS for avatar uploads
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await serviceSupabase.storage.from('avatars').upload(path, file)

  if (error) {
    console.error('[avatar upload] error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicUrlData } = serviceSupabase.storage.from('avatars').getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrlData.publicUrl })
}
