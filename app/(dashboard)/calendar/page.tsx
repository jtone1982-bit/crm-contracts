import { requireManagerOrAdmin } from '@/lib/guards'
import CalendarPageClient from './CalendarPageClient'

export default async function CalendarPage() {
  const { profile } = await requireManagerOrAdmin()
  return <CalendarPageClient profile={profile} />
}
