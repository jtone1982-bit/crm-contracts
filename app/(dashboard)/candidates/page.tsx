import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import CandidatesList from '@/components/CandidatesList'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department_id?: string; manager_id?: string; source?: string }>
}) {
  const { status, department_id, manager_id } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role, id, full_name').eq('id', user.id).single()

  if (!profile) {
    redirect('/login')
  }

  const managerId = user.id
  const role = profile.role
  const isAdmin = role === 'admin'

  let query = supabase.from('candidates').select(
    'id, phone, full_name, city_from, city_to, lead_source, next_contact_date, telegram_username, whatsapp_number, max_contact, status, manager_id, manager:profiles(full_name)'
  )
  if (role === 'manager') {
    query = query.eq('manager_id', managerId)
  }
  if (status) {
    query = query.eq('status', status)
  }

  // Admin filter by lead_source
  const { source } = await searchParams as { source?: string }
  if (isAdmin && source) {
    query = query.eq('lead_source', source)
  }

  // Admin: get unique lead sources for filter dropdown
  let leadSources: string[] = []
  if (isAdmin) {
    const { data: sources } = await getSupabaseAdmin()
      .from('candidates')
      .select('lead_source')
      .not('lead_source', 'is', null)
      .neq('lead_source', '')
    leadSources = [...new Set((sources?.map(s => s.lead_source).filter(Boolean) as string[]))].sort()
  }

  const { data: candidates } = await query.order('created_at', { ascending: false })

  return <CandidatesList candidates={candidates || []} statusFilter={status} isAdmin={isAdmin} leadSources={leadSources} activeSource={source} />
}
