'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Alert {
  id: string
  title: string
  body: string
  importance: string
  created_at: string
}

export default function AlertModal() {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAlerts()
    const interval = setInterval(checkAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAlerts = async () => {
    if (loading) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: allAlerts } = await supabase
      .from('alerts')
      .select('id, title, body, importance, created_at, alert_reads(manager_id)')
      .order('created_at', { ascending: false })

    if (allAlerts) {
      const unread = allAlerts.find(a =>
        !a.alert_reads || (a.alert_reads as any[]).length === 0 ||
        !(a.alert_reads as any[]).some((r: any) => r.manager_id === user.id)
      )
      if (unread) {
        setAlert(unread as Alert)
      } else {
        setAlert(null)
      }
    }
  }

  const handleConfirm = async () => {
    if (!alert) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    await supabase.from('alert_reads').insert({
      alert_id: alert.id,
      manager_id: user.id,
    })

    setAlert(null)
    setLoading(false)
  }

  if (!alert) return null

  const importanceColors: Record<string, { border: string; icon: string }> = {
    'Обычная': { border: 'rgba(94,106,210,0.3)', icon: '🔵' },
    'Важная': { border: 'rgba(251,191,36,0.3)', icon: '🟡' },
    'Критичная': { border: 'rgba(248,113,113,0.3)', icon: '🔴' },
  }

  const colors = importanceColors[alert.importance] || importanceColors['Обычная']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-md mx-4 rounded-2xl p-6 animate-fade-in"
        style={{
          background: '#191a1b',
          border: '1px solid ' + colors.border,
          boxShadow: '0 0 40px ' + colors.border,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{colors.icon}</span>
          <h2 className="text-xl font-bold" style={{ color: '#f7f8f8' }}>{alert.title}</h2>
        </div>

        <div className="mb-6 text-[15px] leading-relaxed" style={{ color: '#8a8f98' }}>
          {alert.body}
        </div>

        <div className="text-xs mb-4" style={{ color: '#5c6168' }}>
          Отправлено: {new Date(alert.created_at).toLocaleString('ru-RU')}
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ background: '#5e6ad2' }}
        >
          {loading ? 'Сохраняем...' : '✅ Я прочитал, понял'}
        </button>
      </div>
    </div>
  )
}
