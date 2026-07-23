import { requireManagerOrAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { CandidateForm } from '@/components/CandidateForm'
import { PIPELINE_STATUSES } from '@/lib/types'
import StatusHistory from '@/components/StatusHistory'

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { supabase, user, profile } = await requireManagerOrAdmin()

  let query = supabase.from('candidates').select('*').eq('id', id)
  if (profile.role === 'manager') query = query.eq('manager_id', user.id)

  const { data: candidate, error: candidateError } = await query.maybeSingle()
  if (candidateError || !candidate) notFound()

  const candidateFiles = await supabase
    .from('candidate_files')
    .select('id, file_type, file_url, file_name')
    .eq('candidate_id', id)

  const candidateWithFiles = { ...candidate, candidate_files: candidateFiles || [] }

  const { data: history } = await supabase
    .from('candidate_status_history')
    .select('id, old_status, new_status, changed_at, profiles(full_name)')
    .eq('candidate_id', id)
    .order('changed_at', { ascending: false })

  async function updateCandidate(formData: FormData) {
    'use server'
    const values: Record<string, any> = {}
    const fields = [
      'full_name', 'birth_date', 'age', 'citizen_rf', 'city_from', 'city_to', 'lead_source',
      'health_group', 'health_group_reason', 'diseases', 'other_health_issues',
      'criminal_record', 'criminal_article', 'documents', 'foreign_documents', 'driver_license',
      'family_relation', 'status', 'notes', 'departure_date', 'departure_datetime',
      'next_contact_date', 'reason_for_failure', 'failure_comment', 'comments', 'telegram_username', 'whatsapp_number', 'max_contact',
    ]
    for (const field of fields) {
      values[field] = formData.get(field)?.toString() || null
    }
    values.is_officer = formData.get('is_officer') === 'on'
    values.is_woman = formData.get('is_woman') === 'on'
    values.is_commissioned = formData.get('is_commissioned') === 'on'

    if (values.diseases) values.diseases = JSON.parse(values.diseases)
    if (values.documents) values.documents = JSON.parse(values.documents)

    for (const key of ['is_officer', 'is_woman', 'is_commissioned']) {
      if (values[key] === 'Да') values[key] = true
      if (values[key] === 'Нет') values[key] = false
    }

    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) redirect('/login')

    const oldStatus = candidate.status
    const newStatus = values.status

    await client.from('candidates').update(values).eq('id', id)

    if (oldStatus !== newStatus) {
      await client.from('candidate_status_history').insert({
        candidate_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user.id,
      })
    }

    redirect(`/candidates/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Карточка кандидата</h1>
        <a href="/" className="text-blue-600 hover:underline">← Назад</a>
      </div>
      <CandidateForm candidate={candidateWithFiles} statuses={PIPELINE_STATUSES.slice()} onSubmit={updateCandidate} />
      <StatusHistory history={history || []} />
    </div>
  )
}
