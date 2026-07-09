import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('id')

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
  }

  const { data: fileRecord, error: findError } = await supabase
    .from('candidate_files')
    .select('id, candidate_id, file_url')
    .eq('id', fileId)
    .single()

  if (findError || !fileRecord) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data: candidate } = await supabase
    .from('candidates')
    .select('manager_id')
    .eq('id', fileRecord.candidate_id)
    .single()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!candidate || !profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (profile.role !== 'admin' && candidate.manager_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Extract path from public URL
  const url = new URL(fileRecord.file_url)
  const pathMatch = url.pathname.match(/\/candidate-files\/(.*)$/)
  if (pathMatch?.[1]) {
    await serviceSupabase.storage.from('candidate-files').remove([pathMatch[1]])
  }

  const { error: deleteError } = await supabase.from('candidate_files').delete().eq('id', fileId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
