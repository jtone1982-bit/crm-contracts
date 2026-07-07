'use client'

import { useEffect } from 'react'

export default function Heartbeat() {
  useEffect(() => {
    function send() {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
    }

    send()
    const interval = setInterval(send, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return null
}
