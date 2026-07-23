'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import EmojiPickerButton from '@/components/EmojiPickerButton'
import MessageContent from '@/components/MessageContent'
import VoiceRecorder from '@/components/VoiceRecorder'
import { formatActivityTime, formatRelativeTime } from '@/lib/datetime'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  attachment_url?: string | null
  sender: { id: string; full_name: string | null; avatar_url?: string | null; last_active_at?: string | null } | null
  receiver: { id: string; full_name: string | null; last_active_at?: string | null } | null
}

function Avatar({ url }: { url?: string | null }) {
  if (!url) return (
    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-600">?</div>
  )
  return (
    <img src={url} alt="" className="w-6 h-6 rounded-full object-cover" />
  )
}

interface PrivateChatPageProps {
  userId: string
}

export default function PrivateChatPage({ userId: receiverId }: PrivateChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markRead = useCallback(async () => {
    try {
      await fetch(`/api/messages/unread?receiverId=${receiverId}`, { method: 'POST' })
      window.dispatchEvent(new CustomEvent('refresh-unread'))
    } catch {}
  }, [receiverId])

  const loadMessages = async (q = '') => {
    const params = new URLSearchParams()
    params.set('receiverId', receiverId)
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/messages?${params.toString()}`)
    const data = await res.json()
    setMessages(data.messages || [])
    markRead()
  }

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.user_metadata?.sub || ''))
    loadMessages()
    const interval = setInterval(() => loadMessages(search), 5000)

    return () => clearInterval(interval)
  }, [receiverId, search])

  useEffect(() => {
    const receiver = messages.find((m) => m.sender_id === receiverId)?.sender
    if (receiver?.full_name) setReceiverName(receiver.full_name)
  }, [messages, receiverId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadMessages(value)
    }, 400)
  }

  async function sendMessage(content: string, attachmentUrl?: string) {
    if (!content?.trim() && !attachmentUrl?.trim()) return

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, receiverId, attachmentUrl }),
    })

    if (res.ok) {
      setText('')
      await loadMessages()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await sendMessage(text)
  }

  function renderAttachment(m: Message) {
    if (!m.attachment_url) return null
    return (
      <audio controls className="mt-2 max-w-full">
        <source src={m.attachment_url} />
        Ваш браузер не поддерживает аудио.
      </audio>
    )
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
              <div className="text-xs font-medium mb-1 flex items-center gap-1">
                {m.sender_id === currentUserId ? 'Вы' : <Avatar url={m.sender?.avatar_url} />}
                {m.sender_id === currentUserId ? '' : (m.sender?.full_name || 'Пользователь')}
                {m.sender_id !== currentUserId && m.sender?.last_active_at && (
                  <span className="ml-2 text-gray-400 font-normal">
                    {formatActivityTime(m.sender.last_active_at)} ({formatRelativeTime(m.sender.last_active_at)})
                  </span>
                )}
              </div>
              <div className="text-sm">
                <MessageContent content={m.content} />
              </div>
              {renderAttachment(m)}
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
        <EmojiPickerButton onEmojiClick={(emoji) => setText((t) => t + emoji)} />
        <VoiceRecorder onRecorded={sendMessage} />
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
