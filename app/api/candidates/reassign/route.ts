import { NextResponse } from 'next/server'
import { requireManagerOrAdmin } from '@/lib/guards'

export async function POST(request: Request) {
  const { supabase, user, profile } = await requireManagerOrAdmin()
  const isAdmin = profile.role === 'admin'

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { candidateIds, managerId } = body

  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    return NextResponse.json({ error: 'Не выбраны кандидаты' }, { status: 400 })
  }
  if (!managerId) {
    return NextResponse.json({ error: 'Не выбран менеджер' }, { status: 400 })
  }

  // Verify target manager exists and is allowed
  const { data: targetManager, error: managerError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', managerId)
    .in('role', ['manager', 'admin'])
    .single()

  if (managerError || !targetManager) {
    return NextResponse.json({ error: 'Менеджер не найден' }, { status: 404 })
  }

  // Non-admin can only transfer to themselves
  if (!isAdmin && managerId !== user.id) {
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
  }

  // Build filter to only update candidates the current user can manage
  let query = supabase.from('candidates').update({ manager_id: managerId }).in('id', candidateIds)
  if (!isAdmin) {
    query = query.eq('manager_id', user.id)
  }

  const { data, error } = await query.select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ updated: (data || []).length })
}
