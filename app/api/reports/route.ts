import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'

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
  let query = admin.from('candidates').select('id, status, lead_source, manager_id, created_at, manager:profiles(full_name)')

  if (statuses.length > 0) {
    query = query.in('status', statuses)
  }
  if (sources.length > 0) {
    query = query.in('lead_source', sources)
  }
  if (managerId) {
    query = query.eq('manager_id', managerId)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59')
  }

  const { data: candidates, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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
    const name = Array.isArray(c.manager) ? (c.manager as any[])[0]?.full_name : (c.manager as any)?.full_name
    const key = (name as string) || c.manager_id || '—'
    const existing = managerMap.get(key) || { name: (name as string) || '—', count: 0 }
    existing.count++
    managerMap.set(key, existing)
  }
  const byManager = Array.from(managerMap.entries())
    .map(([_, v]) => ({
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