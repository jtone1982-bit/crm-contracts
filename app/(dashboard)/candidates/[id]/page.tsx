import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { CandidateForm } from '@/components/CandidateForm'
import { PIPELINE_STATUSES } from '@/lib/types'

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  let query = supabase
    .from('candidates')
    .select('*, candidate_files(id, file_type, file_url, file_name)')
    .eq('id', params.id)

  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  const { data: candidate, error: candidateError } = await query.maybeSingle()

  if (candidateError) {
    console.error('[candidate page] error', candidateError.message)
    notFound()
  }

  if (!candidate) {
    notFound()
  }

  async function updateCandidate(formData: FormData) {
    'use server'
    const values: Record<string, any> = {}

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

    for (const field of fields) {
      values[field] = formData.get(field)?.toString() || null
    }

    values.is_officer = formData.get('is_officer') === 'on'
    values.is_woman = formData.get('is_woman') === 'on'
    values.is_commissioned = formData.get('is_commissioned') === 'on'

    const client = await createClient()
    await client.from('candidates').update(values).eq('id', params.id)
    redirect(`/candidates/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Карточка кандидата</h1>
        <a href="/" className="text-blue-600 hover:underline">← Назад</a>
      </div>

      <CandidateForm candidate={candidate} statuses={PIPELINE_STATUSES.slice()} onSubmit={updateCandidate} />
    </div>
  )
}
