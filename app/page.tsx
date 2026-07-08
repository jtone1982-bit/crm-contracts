import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CandidatesDashboard from '@/components/CandidatesDashboard'

export default async function DashboardPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!profile) {
    redirect('/login')
  }

  let query = supabase.from('candidates').select('*').order('created_at', { ascending: false })
  if (profile.role === 'manager') {
    query = query.eq('manager_id', user.id)
  }

  const { data: candidates } = await query

  return <CandidatesDashboard candidates={candidates || []} profile={profile} />
}
