import { requireAdmin } from '@/lib/guards'
import { createAdminClient } from '@/lib/supabase-server'
import UsersList from '@/components/UsersList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const searchQuery = params.q || ''

  const adminClient = createAdminClient()

  let profilesQuery = adminClient
    .from('profiles')
    .select('id, email, full_name, role, approved, active, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }

  const { data: profiles } = await profilesQuery

  // Get candidates count per user
  const { data: candidates } = await adminClient
    .from('candidates')
    .select('manager_id, id')

  const candidatesCount = new Map<string, number>()
  candidates?.forEach((c) => {
    const key = c.manager_id || ''
    candidatesCount.set(key, (candidatesCount.get(key) || 0) + 1)
  })

  // Get all managers/admins for transfer dropdown
  const { data: managers } = await adminClient
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['manager', 'admin'])
    .order('full_name', { ascending: true, nullsFirst: false })

  const usersWithStats = (profiles || []).map((p) => ({
    ...p,
    candidates_count: candidatesCount.get(p.id) || 0,
  }))

  return (
    <div className="space-y-6">
      <UsersList users={usersWithStats} managers={managers || []} searchQuery={searchQuery} />
    </div>
  )
}
