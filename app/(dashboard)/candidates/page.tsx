import { requireManagerOrAdmin } from '@/lib/guards'
import CandidatesPageClient from '@/components/CandidatesPageClient'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  await requireManagerOrAdmin()

  // Get params from URL
  const status = typeof searchParams?.status === 'string' ? searchParams.status : undefined
  const source = typeof searchParams?.source === 'string' ? searchParams.source : undefined
  const manager_id = typeof searchParams?.manager_id === 'string' ? searchParams.manager_id : undefined
  const view = typeof searchParams?.view === 'string' ? searchParams.view : undefined
  const pageSize = typeof searchParams?.page_size === 'string' ? parseInt(searchParams.page_size) || 50 : 50
  const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) || 1 : 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const managerId = user.id

  let query = supabase.from('candidates').select(
    'id, phone, full_name, city_from, city_to, lead_source, next_contact_date, telegram_username, whatsapp_number, max_contact, status, manager_id, manager:profiles(full_name)',
    { count: 'exact' }
  )

  if (!isAdmin) {
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

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: candidates, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

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

  const defaultView = (view as 'list' | 'kanban' | 'split') || 'list'
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <CandidatesPageClient
      candidates={candidates || []}
      statusFilter={status}
      isAdmin={isAdmin}
      leadSources={leadSources}
      activeSource={source}
      managers={managers}
      activeManagerId={manager_id}
      defaultView={defaultView}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      pageSize={pageSize}
    />
  )
}
