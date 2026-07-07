'use client'

import { useEffect, useState, useCallback } from 'react'

export default function UnreadBadge({ generalOnly = false }: { generalOnly?: boolean }) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/unread')
      const data = await res.json()
      setCount(generalOnly ? data.general || 0 : data.total || 0)
    } catch (e) {
      console.error(e)
    }
  }, [generalOnly])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)

    function handleRefresh() {
      load()
    }

    window.addEventListener('refresh-unread', handleRefresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('refresh-unread', handleRefresh)
    }
  }, [load])

  if (count === 0) return null

  return (
    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[1.25rem]">
      {count > 99 ? '99+' : count}
    </span>
  )
}
