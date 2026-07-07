'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/components/NotificationProvider'

interface Profile {
  id: string
  email: string
  full_name: string | null
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

function useUnreadCounts() {
  const [counts, setCounts] = useState({ general: 0, private: 0, total: 0 })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/messages/unread')
        const data = await res.json()
        setCounts(data)
      } catch (e) {
        console.error(e)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  return counts
}

export default function MessagesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({})
  const unread = useUnreadCounts()
  const { permission, requestPermission } = useNotifications()

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
        <h1 className="text-2xl font-bold">Сообщения</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Назад</Link>
      </div>

      {permission === 'default' && (
        <button
          onClick={requestPermission}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
        >
          Включить уведомления в браузере
        </button>
      )}

      <div className="space-y-3">
        <Link
          href="/messages/news"
          className="block bg-white border rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Новости компании</div>
              <div className="text-sm text-gray-500">Только администраторы</div>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Канал</span>
          </div>
        </Link>

        <Link
          href="/messages/general"
          className="block bg-white border rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Общий чат</div>
              <div className="text-sm text-gray-500">Все пользователи</div>
            </div>
            {unread.general > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">{unread.general}</span>
            )}
          </div>
        </Link>

        <div className="pt-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Личные сообщения</h2>
          {loading && <div className="text-sm text-gray-400">Загрузка...</div>}
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/messages/${p.id}`}
              className="block bg-white border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.full_name || p.email}</div>
                  {p.full_name && <div className="text-sm text-gray-500">{p.email}</div>}
                  {lastMessages[p.id]?.content && (
                    <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px] sm:max-w-sm">
                      {lastMessages[p.id].sender_id === p.id ? '' : 'Вы: '}
                      {lastMessages[p.id].content}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {lastMessages[p.id]?.created_at
                      ? new Date(lastMessages[p.id].created_at).toLocaleDateString('ru-RU')
                      : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {!loading && profiles.length === 0 && (
            <div className="text-sm text-gray-400">Нет доступных пользователей</div>
          )}
        </div>
      </div>
    </div>
  )
}
