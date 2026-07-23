import { requireManagerOrAdmin } from '@/lib/guards'
import CandidatesDashboard from '@/components/CandidatesDashboard'

export default async function DashboardPage() {
  const { supabase, profile } = await requireManagerOrAdmin()

  const { data: departments } = await supabase.from('departments').select('*').order('name')

  return <CandidatesDashboard profile={profile} departments={departments || []} />
}
