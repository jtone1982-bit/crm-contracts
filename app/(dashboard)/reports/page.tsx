import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ReportsView from '@/components/ReportsView'
import { PIPELINE_STATUSES } from '@/lib/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  if (profile.role !== 'admin') redirect('/')

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

  return (
    <ReportsView
      statuses={PIPELINE_STATUSES}
      leadSources={leadSources}
      managers={managers?.map((m) => ({ id: m.id, name: m.full_name || m.email })) || []}
    />
  )
}