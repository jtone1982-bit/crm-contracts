interface StatusHistoryItem {
  id: string
  old_status: string | null
  new_status: string
  changed_at: string
  profiles?: { full_name: string | null }[] | null
}

interface StatusHistoryProps {
  history: StatusHistoryItem[]
}

export default function StatusHistory({ history }: StatusHistoryProps) {
  if (!history || history.length === 0) return null

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h3 className="font-medium">История изменений статуса</h3>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="text-sm">
            <span className="font-medium">{h.profiles?.[0]?.full_name || 'Менеджер'}</span>
            {' — '}
            {h.old_status ? (
              <span className="text-gray-600">{h.old_status} → </span>
            ) : null}
            <span className="font-medium">{h.new_status}</span>
            <span className="text-gray-400 ml-2">
              {new Date(h.changed_at).toLocaleString('ru-RU')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
