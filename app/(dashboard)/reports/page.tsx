import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ReportsView from '@/components/ReportsView'
import { PIPELINE_STATUSES } from '@/lib/types'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ statuses?: string; sources?: string; manager_id?: string; date_from?: string; date_to?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  if (profile.role !== 'admin') redirect('/')

  const params = await searchParams
  const selectedStatuses = params.statuses?.split(',').filter(Boolean) || []
  const selectedSources = params.sources?.split(',').filter(Boolean) || []
  const selectedManager = params.manager_id || ''
  const dateFrom = params.date_from || ''
  const dateTo = params.date_to || ''

  // Get unique lead sources
  const { data: sources } = await getSupabaseAdmin()
    .from('candidates')
    .select('lead_source')
    .not('lead_source', 'is', null)
    .neq('lead_source', '')

  const leadSources = [...new Set((sources?.map((s) => s.lead_source).filter(Boolean) as string[]))].sort()

  // Get managers
  const { data: managers } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'manager')
    .eq('approved', true)
    .eq('active', true)
    .order('full_name')

  // Pre-fetch report data on the server if any filter is selected
  let initialReport = null as any

  if (selectedStatuses.length > 0 || selectedSources.length > 0 || selectedManager || dateFrom || dateTo) {
    let query = getSupabaseAdmin()
      .from('candidates')
      .select('id, status, lead_source, manager_id, created_at, manager:profiles(full_name)')

    if (selectedStatuses.length > 0) query = query.in('status', selectedStatuses) as any
    if (selectedSources.length > 0) query = query.in('lead_source', selectedSources) as any
    if (selectedManager) query = query.eq('manager_id', selectedManager) as any
    if (dateFrom) query = query.gte('created_at', dateFrom) as any
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59') as any

    const { data: candidates } = await query

    const total = candidates?.length || 0

    const statusMap = new Map<string, number>()
    const sourceMap = new Map<string, number>()
    const managerMap = new Map<string, { name: string; count: number }>()
    const crossMap = new Map<string, number>()

    for (const c of candidates || []) {
      const st = c.status || '—'
      statusMap.set(st, (statusMap.get(st) || 0) + 1)
      const src = c.lead_source || '—'
      if (src !== '—') sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
      const mgrName = Array.isArray((c as any).manager) ? (c.manager as any[])[0]?.full_name : (c.manager as any)?.full_name
      const mgrKey = (mgrName as string) || c.manager_id || '—'
      const mgr = managerMap.get(mgrKey) || { name: mgrKey, count: 0 }
      mgr.count++
      managerMap.set(mgrKey, mgr)
      if (src !== '—') crossMap.set(`${st}||${src}`, (crossMap.get(`${st}||${src}`) || 0) + 1)
    }

    const byStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)

    const bySource = Array.from(sourceMap.entries())
      .map(([lead_source, count]) => ({ lead_source, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)

    const byManager = Array.from(managerMap.entries())
      .map(([_, v]) => ({ manager_name: v.name, count: v.count, percentage: total > 0 ? (v.count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)

    const byStatusAndSource = Array.from(crossMap.entries())
      .map(([key, count]) => {
        const [status, lead_source] = key.split('||')
        return { status, lead_source, count }
      })

    initialReport = { total, byStatus, bySource, byManager, byStatusAndSource }
  }

  return (
    <ReportsView
      statuses={PIPELINE_STATUSES}
      leadSources={leadSources}
      managers={managers?.map((m) => ({ id: m.id, name: m.full_name || m.email })) || []}
      initialReport={initialReport}
      initialStatuses={selectedStatuses}
      initialSources={selectedSources}
      initialManager={selectedManager}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
    />
  )
}