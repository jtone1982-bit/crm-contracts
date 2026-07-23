import { requireManagerOrAdmin } from '@/lib/guards'
import NewsPageClient from './NewsPageClient'

export default async function NewsPage() {
  const { profile } = await requireManagerOrAdmin()
  return <NewsPageClient isAdmin={profile.role === 'admin'} />
}
