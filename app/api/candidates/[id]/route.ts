import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('candidates')
    .select('*, candidate_files(id, file_type, file_url, file_name)')
    .eq('id', id)

  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  const { data: candidate, error } = await query.maybeSingle()

  if (error || !candidate) {
    return NextResponse.json({ error: error?.message || 'Not found' }, { status: error ? 500 : 404 })
  }

  return NextResponse.json(candidate)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Managers can only update their own candidates
  if (profile.role === 'manager') {
    const { data: existing } = await supabase
      .from('candidates')
      .select('manager_id')
      .eq('id', id)
      .single()
    if (!existing || existing.manager_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Parse JSON arrays from form data strings safely
  function safeParse(value: any) {
    if (value === undefined || value === null) return undefined
    if (value === '') return null
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  const diseases = safeParse(body.diseases)
  const documents = safeParse(body.documents)

  const update: Record<string, any> = {}
  const fields = [
    'full_name', 'birth_date', 'age', 'citizen_rf', 'city_from', 'city_to',
    'lead_source', 'health_group', 'health_group_reason', 'diseases', 'scars', 'other_health_issues',
    'criminal_record', 'criminal_article', 'documents', 'foreign_documents', 'driver_license',
    'family_relation', 'is_officer', 'is_woman', 'is_commissioned', 'status', 'notes',
    'departure_date', 'departure_datetime', 'next_contact_date', 'reason_for_failure',
    'failure_comment', 'comments', 'telegram_username', 'whatsapp_number', 'max_contact',
  ]
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f]
  }
  if (diseases !== undefined) update.diseases = diseases
  if (documents !== undefined) update.documents = documents

  // Booleans: convert "Да"/"Нет" strings to boolean
  for (const key of ['is_officer', 'is_woman', 'is_commissioned']) {
    if (update[key] === 'Да') update[key] = true
    if (update[key] === 'Нет') update[key] = false
    if (update[key] === '') update[key] = null
  }

  update.last_activity_at = new Date().toISOString()

  const { data, error } = await supabase.from('candidates').update(update).eq('id', id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
