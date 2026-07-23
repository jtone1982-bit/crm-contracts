import { requireManagerOrAdmin } from '@/lib/guards'
import PhoneParser from '@/components/PhoneParser'

export default async function ParserPage() {
  await requireManagerOrAdmin()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Инструменты</h1>
      <PhoneParser />
    </div>
  )
}
