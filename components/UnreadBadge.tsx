'use client'

import { useEffect, useState } from 'react'

export default function UnreadBadge({ generalOnly = false }: { generalOnly?: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/messages/unread')
        const data = await res.json()
        setCount(generalOnly ? data.general || 0 : data.total || 0)
      } catch (e) {
        console.error(e)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [generalOnly])

  if (count === 0) return null

  return (
    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[1.25rem]">
      {count > 99 ? '99+' : count}
    </span>
  )
}
