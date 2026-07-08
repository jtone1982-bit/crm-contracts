import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const reqHeaders = await headers()
  const authHeader = reqHeaders.get('authorization') || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Find candidates stuck on 'На обзвон' for more than 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stuckCandidates, error: stuckError } = await supabase
    .from('candidates')
    .select('id, manager_id, last_activity_at')
    .eq('status', 'На обзвон')
    .or(`last_activity_at.lt.${threeDaysAgo},last_activity_at.is.null`)

  if (stuckError || !stuckCandidates || stuckCandidates.length === 0) {
    return NextResponse.json({ reassigned: 0 })
  }

  // Find managers inactive for more than 2 days
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: inactiveManagers } = await supabase
    .from('profiles')
    .select('id, last_active_at')
    .eq('role', 'manager')
    .eq('approved', true)
    .eq('active', true)
    .or(`last_active_at.lt.${twoDaysAgo},last_active_at.is.null`)

  const inactiveManagerIds = new Set((inactiveManagers || []).map((m) => m.id))

  // Get all active managers for round-robin
  const { data: activeManagers } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'manager')
    .eq('approved', true)
    .eq('active', true)

  if (!activeManagers || activeManagers.length === 0) {
    return NextResponse.json({ reassigned: 0, error: 'No active managers' })
  }

  const toReassign = stuckCandidates.filter((c) => inactiveManagerIds.has(c.manager_id))
  let reassigned = 0

  for (let i = 0; i < toReassign.length; i++) {
    const candidate = toReassign[i]
    const newManager = activeManagers[i % activeManagers.length]

    const { error } = await supabase
      .from('candidates')
      .update({ manager_id: newManager.id, last_activity_at: new Date().toISOString() })
      .eq('id', candidate.id)

    if (!error) reassigned++
  }

  return NextResponse.json({ reassigned })
}
