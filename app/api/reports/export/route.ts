import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

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
  let query = admin
    .from('candidates')
    .select('id, phone, full_name, status, lead_source, city_from, city_to, created_at, manager:profiles(full_name)')

  if (statuses.length > 0) query = query.in('status', statuses)
  if (sources.length > 0) query = query.in('lead_source', sources)
  if (managerId) query = query.eq('manager_id', managerId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data: candidates, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = candidates?.length || 0

  // Aggregate
  const statusMap = new Map<string, number>()
  const sourceMap = new Map<string, number>()
  const managerMap = new Map<string, { name: string; count: number }>()
  const crossMap = new Map<string, number>()

  for (const c of candidates || []) {
    const st = c.status || '—'
    statusMap.set(st, (statusMap.get(st) || 0) + 1)

    const src = c.lead_source || '—'
    if (src !== '—') sourceMap.set(src, (sourceMap.get(src) || 0) + 1)

    const mgrName = Array.isArray(c.manager) ? (c.manager as any[])[0]?.full_name : (c.manager as any)?.full_name
    const mgrKey = (mgrName as string) || '—'
    const mgr = managerMap.get(mgrKey) || { name: mgrKey, count: 0 }
    mgr.count++
    managerMap.set(mgrKey, mgr)

    if (src !== '—') {
      const crossKey = `${st}||${src}`
      crossMap.set(crossKey, (crossMap.get(crossKey) || 0) + 1)
    }
  }

  const wb = XLSX.utils.book_new()

  // Sheet 1: Сводка
  const summaryRows = [
    ['Всего кандидатов', total],
    [],
    ['По статусам'],
    ['Статус', 'Количество', 'Процент'],
  ]
  for (const [status, count] of Array.from(statusMap.entries()).sort((a, b) => b[1] - a[1])) {
    summaryRows.push([status, count, `${((count / total) * 100).toFixed(1)}%`])
  }
  summaryRows.push([])
  summaryRows.push(['По источникам'])
  summaryRows.push(['Источник', 'Количество', 'Процент'])
  for (const [source, count] of Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1])) {
    summaryRows.push([source, count, `${((count / total) * 100).toFixed(1)}%`])
  }
  summaryRows.push([])
  summaryRows.push(['По менеджерам'])
  summaryRows.push(['Менеджер', 'Количество', 'Процент'])
  for (const [, v] of Array.from(managerMap.entries()).sort((a, b) => b[1].count - a[1].count)) {
    summaryRows.push([v.name, v.count, `${((v.count / total) * 100).toFixed(1)}%`])
  }
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, ws1, 'Сводка')

  // Sheet 2: Статусы × Источники
  const sortedSources = Array.from(sourceMap.keys()).sort()
  const sortedStatuses = Array.from(statusMap.keys()).sort()
  const crossHeader = ['Статус', ...sortedSources, 'Итого']
  const crossRows: (string | number)[][] = [crossHeader]
  for (const st of sortedStatuses) {
    const row: (string | number)[] = [st]
    let rowTotal = 0
    for (const src of sortedSources) {
      const count = crossMap.get(`${st}||${src}`) || 0
      row.push(count)
      rowTotal += count
    }
    row.push(rowTotal)
    crossRows.push(row)
  }
  const ws2 = XLSX.utils.aoa_to_sheet(crossRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'Статусы × Источники')

  // Sheet 3: Детализация
  const detailRows = candidates?.map((c) => ({
    'Телефон': c.phone,
    'ФИО': c.full_name || '',
    'Статус': c.status,
    'Источник': c.lead_source || '',
    'Откуда': c.city_from || '',
    'Куда': c.city_to || '',
    'Менеджер': Array.isArray(c.manager) ? (c.manager as any[])[0]?.full_name || '' : (c.manager as any)?.full_name || '',
    'Дата создания': c.created_at,
  })) || []
  const ws3 = XLSX.utils.json_to_sheet(detailRows)
  XLSX.utils.book_append_sheet(wb, ws3, 'Детализация')

  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="report_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}