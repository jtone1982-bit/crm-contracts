import { requireManagerOrAdmin } from '@/lib/guards'
import { getSupabaseAdmin } from '@/lib/supabase'
import CandidatesList from '@/components/CandidatesList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department_id?: string; manager_id?: string; source?: string }>
}) {
  const params = await searchParams
  const { status, department_id, manager_id, source } = params

  const { supabase, user, profile } = await requireManagerOrAdmin()

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

  if (isAdmin && source) {
    query = query.eq('lead_source', source)
  }

  if (isAdmin && manager_id) {
    query = query.eq('manager_id', manager_id)
  }

  let leadSources: string[] = []
  let managers: { id: string; full_name: string | null; role: string }[] = []

  if (isAdmin) {
    const { data: sources } = await getSupabaseAdmin()
      .from('candidates')
      .select('lead_source')
      .not('lead_source', 'is', null)
      .neq('lead_source', '')
    leadSources = [...new Set((sources?.map(s => s.lead_source).filter(Boolean) as string[]))].sort()

    const { data: mgrs } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['manager', 'admin'])
      .order('full_name', { ascending: true })
    managers = mgrs || []
  }

  // Supabase PostgREST limits single query to 1000 rows by default.
  // Fetch candidates in batches using range.
  const PAGE_SIZE = 1000
  let allCandidates: any[] = []
  let from = 0
  let to = PAGE_SIZE - 1
  let hasMore = true

  while (hasMore) {
    const { data: batch } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    if (batch && batch.length > 0) {
      allCandidates = allCandidates.concat(batch)
      hasMore = batch.length === PAGE_SIZE
      from += PAGE_SIZE
      to += PAGE_SIZE
    } else {
      hasMore = false
    }
  }

  const candidates = allCandidates
  console.log('Candidates fetched total:', candidates.length)

  return (
    <CandidatesList
      candidates={candidates || []}
      statusFilter={status}
      isAdmin={isAdmin}
      leadSources={leadSources}
      activeSource={source}
      managers={managers}
      activeManagerId={manager_id}
    />
  )
}
