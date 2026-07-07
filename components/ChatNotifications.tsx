'use client'

import { useEffect, useState } from 'react'

interface Message {
  id: string
  sender_id: string
  sender?: { full_name: string | null } | null
  content: string
  is_general: boolean
  receiver_id: string | null
  created_at: string
}

export default function ChatNotifications() {
  const [lastIds, setLastIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.user_metadata?.sub || ''))

    async function poll() {
      try {
        const res = await fetch('/api/messages/unread')
        const unread = await res.json()
        if ((unread.total || 0) === 0) return

        const messagesRes = await fetch('/api/messages?general=true')
        const generalData = await messagesRes.json()

        const privateRes = await fetch('/api/messages')
        const privateData = await privateRes.json()

        const allMessages: Message[] = [
          ...(generalData.messages || []),
          ...(privateData.messages || []),
        ]

        const newMessages = allMessages.filter((m: Message) => {
          if (m.sender_id === currentUserId) return false
          if (lastIds.has(m.id)) return false
          return true
        })

        if (newMessages.length > 0 && !document.hidden) {
          // Still show if tab is not focused but visible? Only notify when hidden.
        }

        if (newMessages.length > 0 && document.hidden) {
          newMessages.slice(0, 3).forEach((m) => {
            const title = m.is_general ? 'Общий чат' : m.sender?.full_name || 'Личное сообщение'
            const body = `${m.sender?.full_name || 'Пользователь'}: ${m.content.slice(0, 100)}`
            const notification = new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: m.id,
            })
            notification.onclick = () => {
              window.focus()
              if (m.is_general) {
                window.location.href = '/messages/general'
              } else if (m.receiver_id) {
                window.location.href = `/messages/${m.sender_id}`
              }
            }
          })
        }

        setLastIds(new Set(allMessages.map((m) => m.id)))
      } catch (e) {
        console.error(e)
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [currentUserId, lastIds])

  return null
}
