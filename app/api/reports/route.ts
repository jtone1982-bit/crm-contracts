import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface ManagerProfile {
  full_name: string | null
}

interface CandidateRow {
  id: string
  status: string | null
  lead_source: string | null
  manager_id: string | null
  created_at: string | null
  manager: ManagerProfile | ManagerProfile[] | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || []
  const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
  const managerId = searchParams.get('manager_id')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const admin = getSupabaseAdmin()
  const PAGE_SIZE = 1000
  let allCandidates: CandidateRow[] = []
  let from = 0
  let to = PAGE_SIZE - 1
  let hasMore = true

  while (hasMore) {
    let pageQuery = admin.from('candidates').select('id, status, lead_source, manager_id, created_at, manager:profiles(full_name)')

    if (statuses.length > 0) {
      pageQuery = pageQuery.in('status', statuses)
    }
    if (sources.length > 0) {
      pageQuery = pageQuery.in('lead_source', sources)
    }
    if (managerId) {
      pageQuery = pageQuery.eq('manager_id', managerId)
    }
    if (dateFrom) {
      pageQuery = pageQuery.gte('created_at', dateFrom)
    }
    if (dateTo) {
      pageQuery = pageQuery.lte('created_at', dateTo + 'T23:59:59')
    }

    const { data: batch, error: pageError } = await pageQuery
      .order('created_at', { ascending: false })
      .range(from, to)

    if (pageError) {
      return NextResponse.json({ error: pageError.message }, { status: 500 })
    }

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

  const total = candidates?.length || 0

  // By status
  const statusMap = new Map<string, number>()
  for (const c of candidates || []) {
    const s = c.status || '—'
    statusMap.set(s, (statusMap.get(s) || 0) + 1)
  }
  const byStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // By source
  const sourceMap = new Map<string, number>()
  for (const c of candidates || []) {
    const s = c.lead_source || '—'
    sourceMap.set(s, (sourceMap.get(s) || 0) + 1)
  }
  const bySource = Array.from(sourceMap.entries())
    .filter(([s]) => s !== '—')
    .map(([lead_source, count]) => ({
      lead_source,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // By manager
  const managerMap = new Map<string, { name: string; count: number }>()
  for (const c of candidates || []) {
    const mgr = c.manager
    const name = Array.isArray(mgr)
      ? mgr[0]?.full_name ?? null
      : mgr?.full_name ?? null
    const key = name || c.manager_id || '—'
    const existing = managerMap.get(key) || { name: name || '—', count: 0 }
    existing.count++
    managerMap.set(key, existing)
  }
  const byManager = Array.from(managerMap.entries())
    .map(([, v]) => ({
      manager_name: v.name,
      count: v.count,
      percentage: total > 0 ? (v.count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Cross: status × source
  const crossMap = new Map<string, number>()
  for (const c of candidates || []) {
    const key = `${c.status || '—'}||${c.lead_source || '—'}`
    crossMap.set(key, (crossMap.get(key) || 0) + 1)
  }
  const byStatusAndSource = Array.from(crossMap.entries())
    .filter(([key]) => !key.endsWith('||—'))
    .map(([key, count]) => {
      const [status, lead_source] = key.split('||')
      return { status, lead_source, count }
    })

  return NextResponse.json({
    total,
    byStatus,
    bySource,
    byManager,
    byStatusAndSource,
  })
}