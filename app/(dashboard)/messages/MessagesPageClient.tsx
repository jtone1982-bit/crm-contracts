'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import UnreadBadge from '@/components/UnreadBadge'
import { useNotifications } from '@/components/NotificationProvider'

interface Profile {
  id: string
  email: string
  full_name: string | null
  last_active_at: string | null
  last_sign_in_at: string | null
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string | null
  content: string
  is_general: boolean
  created_at: string
  sender: { id: string; full_name: string | null } | null
  receiver: { id: string; full_name: string | null } | null
}

interface MessagesPageClientProps {
  isAdmin: boolean
}

export default function MessagesPageClient({ isAdmin }: MessagesPageClientProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({})
  const { permission, requestPermission } = useNotifications()

  const formatActivity = (date: string | null) => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} д назад`
    return d.toLocaleDateString('ru-RU')
  }

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, Message> = {}
        ;(data.messages || []).forEach((m: Message) => {
          const otherId = m.sender_id === m.receiver_id ? m.receiver_id : (m.receiver_id || m.sender_id)
          if (!otherId) return
          if (!map[otherId] || new Date(m.created_at) > new Date(map[otherId].created_at)) {
            map[otherId] = m
          }
        })
        setLastMessages(map)
      })

    fetch('/api/admin/managers-list')
      .then((r) => r.json())
      .then((data) => {
        setProfiles(data.profiles || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#2d2520' }}>Сообщения</h1>
          <p className="text-sm mt-0.5" style={{ color: '#a89a8c' }}>3 непрочитанных</p>
        </div>
        <Link href="/" className="hover:underline" style={{ color: '#c2410c' }}>← Назад</Link>
      </div>

      {permission === 'default' && (
        <button
          onClick={requestPermission}
          className="w-full py-2 rounded-lg text-sm font-semibold transition"
          style={{ background: '#c2410c', color: 'white' }}
        >
          Включить уведомления в браузере
        </button>
      )}

      <div className="space-y-3">
        {isAdmin && (
          <Link
            href="/messages/news"
            className="block bg-[#fefdfb] border rounded-xl p-4 hover:shadow-md transition no-underline"
            style={{ borderColor: 'rgba(60,50,40,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold" style={{ color: '#2d2520' }}>Новости компании</div>
                <div className="text-sm" style={{ color: '#a89a8c' }}>Только администраторы</div>
              </div>
              <span className="px-2 py-1 text-xs rounded font-semibold" style={{ background: '#fef3ed', color: '#c2410c' }}>Канал</span>
            </div>
          </Link>
        )}

        <Link
          href="/messages/general"
          className="block bg-[#fefdfb] border rounded-xl p-4 hover:shadow-md transition no-underline"
          style={{ borderColor: 'rgba(60,50,40,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold" style={{ color: '#2d2520' }}>Общий чат</div>
              <div className="text-sm" style={{ color: '#a89a8c' }}>Все пользователи</div>
            </div>
            <UnreadBadge generalOnly={true} />
          </div>
        </Link>

        <div className="pt-4">
          <h2 className="text-sm font-bold mb-2" style={{ color: '#a89a8c' }}>Личные сообщения</h2>
          {loading && <div className="text-sm" style={{ color: '#a89a8c' }}>Загрузка...</div>}
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/messages/${p.id}`}
              className="block bg-[#fefdfb] border rounded-xl p-4 hover:shadow-md transition mb-2 no-underline"
              style={{ borderColor: 'rgba(60,50,40,0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold" style={{ color: '#2d2520' }}>{p.full_name || p.email}</div>
                  {p.full_name && <div className="text-sm" style={{ color: '#a89a8c' }}>{p.email}</div>}
                  <div className="text-xs mt-1" style={{ color: '#a89a8c' }}>
                    {formatActivity(p.last_active_at) ? `Был на сайте: ${formatActivity(p.last_active_at)}` : ''}
                    {p.last_sign_in_at && !p.last_active_at ? `Вход: ${formatActivity(p.last_sign_in_at)}` : ''}
                  </div>
                  {lastMessages[p.id]?.content && (
                    <div className="text-xs mt-1 truncate max-w-[200px] sm:max-w-sm" style={{ color: '#a89a8c' }}>
                      {lastMessages[p.id].sender_id === p.id ? '' : 'Вы: '}
                      {lastMessages[p.id].content}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <UnreadBadge receiverId={p.id} />
                  <span className="text-xs" style={{ color: '#a89a8c' }}>
                    {lastMessages[p.id]?.created_at
                      ? new Date(lastMessages[p.id].created_at).toLocaleDateString('ru-RU')
                      : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {!loading && profiles.length === 0 && (
            <div className="text-sm" style={{ color: '#a89a8c' }}>Нет доступных пользователей</div>
          )}
        </div>
      </div>
    </div>
  )
}
