import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CandidatesList from '@/components/CandidatesList'

export default async function CandidatesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role, id').eq('id', user.id).single()

  if (!profile) {
    redirect('/login')
  }

  const managerId = user.id
  const role = profile.role

  let query = supabase.from('candidates').select('*')
  if (role === 'manager') {
    query = query.eq('manager_id', managerId)
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: candidates } = await query.order('created_at', { ascending: false })

  return <CandidatesList candidates={candidates || []} statusFilter={searchParams.status} />
}
