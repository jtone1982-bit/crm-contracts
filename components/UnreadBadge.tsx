'use client'

import { useEffect, useState, useCallback } from 'react'

export default function UnreadBadge({
  generalOnly = false,
  receiverId,
}: {
  generalOnly?: boolean
  receiverId?: string
}) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (generalOnly) params.append('general', 'true')
      if (receiverId) params.append('receiverId', receiverId)
      const res = await fetch(`/api/messages/unread?${params.toString()}`)
      const data = await res.json()
      setCount(data.total || 0)
    } catch (e) {
      console.error(e)
    }
  }, [generalOnly, receiverId])

  useEffect(() => {
    setMounted(true)
    load()
    const interval = setInterval(load, 15000)

    function handleRefresh() {
      load()
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        load()
      }
    }

    window.addEventListener('refresh-unread', handleRefresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      window.removeEventListener('refresh-unread', handleRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  if (!mounted || count === 0) return null

  return (
    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[1.25rem]">
      {count > 99 ? '99+' : count}
    </span>
  )
}
