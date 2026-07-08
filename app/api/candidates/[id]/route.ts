import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role, id').eq('id', user.id).single()
  if (!profile) {
    return NextResponse.json({ error: 'Профиль не найден' }, { status: 403 })
  }

  let query = supabase.from('candidates').select('*').eq('id', id)
  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  const { data: candidate, error } = await query.maybeSingle()
  if (error || !candidate) {
    return NextResponse.json({ error: 'Кандидат не найден' }, { status: 404 })
  }

  const { data: candidateFiles } = await supabase
    .from('candidate_files')
    .select('id, file_type, file_url, file_name')
    .eq('candidate_id', id)

  return NextResponse.json({ candidate, files: candidateFiles || [] })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role, id').eq('id', user.id).single()
  if (!profile) {
    return NextResponse.json({ error: 'Профиль не найден' }, { status: 403 })
  }

  let accessQuery = supabase.from('candidates').select('id').eq('id', id)
  if (profile.role === 'manager') {
    accessQuery = accessQuery.eq('manager_id', profile.id)
  }

  const { data: existing } = await accessQuery.maybeSingle()
  if (!existing) {
    return NextResponse.json({ error: 'Кандидат не найден' }, { status: 404 })
  }

  const body = await request.json()

  const fields = [
    'full_name',
    'birth_date',
    'city_from',
    'city_to',
    'lead_source',
    'health_group',
    'diseases',
    'scars',
    'documents',
    'status',
    'notes',
    'departure_date',
    'next_contact_date',
  ]

  const values: Record<string, any> = {}
  for (const field of fields) {
    values[field] = body[field] ?? null
  }

  values.is_officer = !!body.is_officer
  values.is_woman = !!body.is_woman
  values.is_commissioned = !!body.is_commissioned

  const { error } = await supabase.from('candidates').update(values).eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
