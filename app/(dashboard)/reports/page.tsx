import { requireManagerOrAdmin } from '@/lib/guards'
import ReportsPageClient from './ReportsPageClient'

export default async function ReportsPage() {
  await requireManagerOrAdmin()
  return <ReportsPageClient />
}
