'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Alert {
  id: string
  created_at: string
  title: string
  body: string
  importance: string
  target_manager_ids: string[] | null
}

interface AlertRead {
  alert_id: string
  manager_id: string
  read_at: string
}

interface Manager {
  id: string
  full_name: string | null
}

export default function AlertHistory({ managers }: { managers: Manager[] }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertReads, setAlertReads] = useState<AlertRead[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    const { data: alertsData } = await supabase
      .from('alerts')
      .select('id, created_at, title, body, importance, target_manager_ids')
      .order('created_at', { ascending: false })

    const { data: readsData } = await supabase
      .from('alert_reads')
      .select('alert_id, manager_id, read_at')

    setAlerts(alertsData || [])
    setAlertReads(readsData || [])
    setLoading(false)
  }

  const managerMap = new Map(managers.map(m => [m.id, m.full_name || '—']))

  const getReadStatus = (alert: Alert) => {
    const recipients = alert.target_manager_ids && alert.target_manager_ids.length > 0
      ? alert.target_manager_ids
      : managers.map(m => m.id)

    const readsForAlert = alertReads.filter(r => r.alert_id === alert.id)
    const readBy = new Map(readsForAlert.map(r => [r.manager_id, r.read_at]))

    return recipients.map(id => {
      const name = managerMap.get(id) || '—'
      const readAt = readBy.get(id)
      return { name, readAt, id }
    })
  }

  if (loading) {
    return <div className="text-sm" style={{ color: '#5c6168' }}>Загрузка истории...</div>
  }

  if (alerts.length === 0) {
    return <div className="text-sm" style={{ color: '#5c6168' }}>Пока нет отправленных алертов.</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: '#f7f8f8' }}>📋 История алертов</h2>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const statuses = getReadStatus(alert)
          const readCount = statuses.filter(s => s.readAt).length
          const totalCount = statuses.length

          return (
            <div
              key={alert.id}
              className="rounded-xl p-4 border"
              style={{ background: '#0f1011', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: '#f7f8f8' }}>{alert.title}</h3>
                  <div className="text-xs mt-1" style={{ color: '#5c6168' }}>
                    {new Date(alert.created_at).toLocaleString('ru-RU')}
                    {' · '}
                    <span style={{ color: alert.importance === 'Критичная' ? '#f87171' : alert.importance === 'Важная' ? '#fbbf24' : '#8a8f98' }}>
                      {alert.importance}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#191a1b', color: readCount === totalCount ? '#4ade80' : '#fbbf24' }}>
                  {readCount}/{totalCount} прочитали
                </div>
              </div>

              <p className="text-sm mb-3" style={{ color: '#8a8f98' }}>{alert.body}</p>

              <div className="text-xs space-y-1">
                <div style={{ color: '#5c6168' }}>Получатели:</div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        background: s.readAt ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                        color: s.readAt ? '#4ade80' : '#8a8f98',
                        border: '1px solid ' + (s.readAt ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'),
                      }}
                    >
                      {s.readAt ? '✓' : '○'} {s.name}
                      {s.readAt && (
                        <span style={{ color: '#5c6168' }}>
                          {' '}· {new Date(s.readAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
