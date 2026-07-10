import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CandidatesList from '@/components/CandidatesList'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department_id?: string; manager_id?: string }>
}) {
  const { status, department_id, manager_id } = await searchParams

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

  let query = supabase.from('candidates').select(
    'id, phone, full_name, city_from, city_to, next_contact_date, telegram_username, whatsapp_number, max_contact, status'
  )
  if (role === 'manager') {
    query = query.eq('manager_id', managerId)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data: candidates } = await query.order('created_at', { ascending: false })

  return <CandidatesList candidates={candidates || []} statusFilter={status} />
}
