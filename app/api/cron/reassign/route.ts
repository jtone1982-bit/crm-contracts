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

  // Find candidates stuck on 'На обзвон' for more than 3 days.
  // Use last_activity_at if present, otherwise fall back to created_at.
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stuckCandidates, error: stuckError } = await supabase.rpc('get_stuck_candidates', {
    cutoff: threeDaysAgo,
  })

  if (stuckError) {
    console.error('[cron reassign] get_stuck_candidates error', stuckError.message)
  }

  if (!stuckCandidates || stuckCandidates.length === 0) {
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

  // A manager without any login (last_active_at null) IS considered inactive.
  // Also a manager who hasn't been active for 2+ days is inactive.
  const inactiveManagerIds = new Set(
    (inactiveManagers || [])
      .map((m: any) => m.id)
  )

  // Get all active managers for round-robin (exclude inactive ones)
  const { data: activeManagers } = await supabase
    .from('profiles')
    .select('id, last_active_at')
    .eq('role', 'manager')
    .eq('approved', true)
    .eq('active', true)
    .or(`last_active_at.gte.${twoDaysAgo}`)

  // Exclude managers with null last_active_at (never logged in)
  const activeFiltered = (activeManagers || []).filter((m: any) => m.last_active_at !== null)

  if (activeFiltered.length === 0) {
    return NextResponse.json({ reassigned: 0, error: 'No active managers' })
  }

  const toReassign = stuckCandidates.filter((c: any) => inactiveManagerIds.has(c.manager_id))
  let reassigned = 0

  for (let i = 0; i < toReassign.length; i++) {
    const candidate: any = toReassign[i]
    const newManager: any = activeFiltered[i % activeFiltered.length]

    const { error } = await supabase
      .from('candidates')
      .update({ manager_id: newManager.id, last_activity_at: new Date().toISOString() })
      .eq('id', candidate.id)

    if (!error) reassigned++
  }

  return NextResponse.json({ reassigned })
}
