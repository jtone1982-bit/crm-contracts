'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

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

export default function MessagesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [generalUnread, setGeneralUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/messages?general=true').then((r) => r.json()).then((data) => {
      const lastRead = localStorage.getItem('general_chat_last_read')
      const messages = data.messages || []
      const unread = lastRead
        ? messages.filter((m: Message) => new Date(m.created_at) > new Date(lastRead)).length
        : messages.length
      setGeneralUnread(unread)
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
            {generalUnread > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">{generalUnread}</span>
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
              <div className="font-medium">{p.full_name || p.email}</div>
              {p.full_name && <div className="text-sm text-gray-500">{p.email}</div>}
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
