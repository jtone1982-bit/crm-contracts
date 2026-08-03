import { requireAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase-server'
import AlertSender from '@/components/AlertSender'
import AlertHistory from '@/components/AlertHistory'

export default async function AdminAlertsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: managers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['manager', 'admin'])
    .order('full_name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#f7f8f8' }}>Админ: Алерты</h1>
      <AlertSender managers={managers || []} />
      <AlertHistory managers={managers || []} />
    </div>
  )
}
