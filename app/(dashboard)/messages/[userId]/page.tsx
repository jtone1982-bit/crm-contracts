'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import EmojiPickerButton from '@/components/EmojiPickerButton'
import MessageContent from '@/components/MessageContent'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: { id: string; full_name: string | null } | null
  receiver: { id: string; full_name: string | null } | null
}

export default function PrivateChatPage() {
  const params = useParams()
  const receiverId = params.userId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadMessages = async (q = '') => {
    const params = new URLSearchParams()
    params.set('receiverId', receiverId)
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/messages?${params.toString()}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.user_metadata?.sub || ''))
    loadReceiver()
    loadMessages()
    const interval = setInterval(() => loadMessages(search), 5000)

    fetch(`/api/messages/unread?receiverId=${receiverId}`, { method: 'POST' })
      .then(() => window.dispatchEvent(new CustomEvent('refresh-unread')))
      .catch(() => {})

    return () => clearInterval(interval)
  }, [receiverId, search])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadReceiver() {
    const res = await fetch(`/api/admin/managers-list`)
    const data = await res.json()
    const user = data.profiles?.find((p: any) => p.id === receiverId)
    if (user) {
      setReceiverName(user.full_name || user.email)
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadMessages(value)
    }, 400)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, receiverId }),
    })

    if (res.ok) {
      setText('')
      await loadMessages()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold truncate">{receiverName || 'Личные сообщения'}</h1>
        <Link href="/messages" className="text-blue-600 hover:underline">← Назад</Link>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Поиск по сообщениям..."
        className="w-full border rounded-lg p-2"
      />

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
                {m.sender_id === currentUserId ? 'Вы' : m.sender?.full_name || 'Пользователь'}
              </div>
              <div className="text-sm">
                <MessageContent content={m.content} />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(m.created_at).toLocaleTimeString('ru-RU')}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="text-sm text-gray-400">Нет сообщений</div>}
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
        <EmojiPickerButton onEmojiClick={(emoji) => setText((t) => t + emoji)} />
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
