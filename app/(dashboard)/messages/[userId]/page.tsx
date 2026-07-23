import { requireManagerOrAdmin } from '@/lib/guards'
import PrivateChatPage from './PrivateChatPage'

export default async function PrivateChatServerPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireManagerOrAdmin()
  const { userId } = await params
  return <PrivateChatPage userId={userId} />
}
