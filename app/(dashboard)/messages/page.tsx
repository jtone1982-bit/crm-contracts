import { requireManagerOrAdmin } from '@/lib/guards'
import MessagesPageClient from './MessagesPageClient'

export default async function MessagesPage() {
  const { profile } = await requireManagerOrAdmin()
  return <MessagesPageClient isAdmin={profile.role === 'admin'} />
}
