import { requireManagerOrAdmin } from '@/lib/guards'
import GeneralChatPage from './GeneralChatPage'

export default async function GeneralChatServerPage() {
  await requireManagerOrAdmin()
  return <GeneralChatPage />
}
