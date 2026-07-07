'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: { id: string; full_name: string | null } | null
  receiver: { id: string; full_name: string | null } | null
}

export default function GeneralChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.user_metadata?.sub || ''))
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    localStorage.setItem('general_chat_last_read', new Date().toISOString())
  }, [messages])

  async function loadMessages() {
    const res = await fetch('/api/messages?general=true')
    const data = await res.json()
    setMessages(data.messages || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, isGeneral: true }),
    })

    if (res.ok) {
      setText('')
      await loadMessages()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Общий чат</h1>
        <Link href="/messages" className="text-blue-600 hover:underline">← Назад</Link>
      </div>

      <div className="flex-1 bg-white border rounded-lg p-4 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender_id === currentUserId ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                m.sender_id === currentUserId
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-xs font-medium mb-1">
                {m.sender?.full_name || 'Пользователь'}
              </div>
              <div className="text-sm">{m.content}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(m.created_at).toLocaleTimeString('ru-RU')}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 border rounded-lg p-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
        >
          Отправить
        </button>
      </form>
    </div>
  )
}
