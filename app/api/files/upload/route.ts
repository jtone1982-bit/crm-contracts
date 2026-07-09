import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const candidateId = formData.get('candidate_id') as string
  const fileType = formData.get('file_type') as string
  const files = formData.getAll('files') as File[]

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Verify ownership
  const { data: candidate } = await supabase
    .from('candidates')
    .select('manager_id')
    .eq('id', candidateId)
    .single()

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  if (profile.role !== 'admin' && candidate.manager_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const uploaded = []

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${candidateId}/${fileType}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await serviceSupabase.storage.from('candidate-files').upload(path, file)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: publicUrlData } = serviceSupabase.storage.from('candidate-files').getPublicUrl(data.path)

    const { data: fileRecord, error: insertError } = await supabase
      .from('candidate_files')
      .insert({
        candidate_id: candidateId,
        file_type: fileType,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    uploaded.push(fileRecord)
  }

  return NextResponse.json({ uploaded })
}
