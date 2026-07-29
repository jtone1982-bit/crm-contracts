import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const departmentId = searchParams.get('department_id')
  const managerId = searchParams.get('manager_id')
  const q = searchParams.get('q')?.trim() || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase.from('candidates').select('*, manager:profiles(full_name)')

  if (profile.role === 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  if (managerId) {
    query = query.eq('manager_id', managerId)
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  // Supabase PostgREST limits single query to 1000 rows by default.
  // Fetch candidates in batches using range.
  const PAGE_SIZE = 1000
  let allCandidates: any[] = []
  let from = 0
  let to = PAGE_SIZE - 1
  let hasMore = true
  let lastError: any = null

  while (hasMore) {
    const { data: batch, error: batchError } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    if (batchError) {
      lastError = batchError
      break
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

  if (lastError) return NextResponse.json({ error: lastError.message }, { status: 500 })
  return NextResponse.json(allCandidates || [])
}
