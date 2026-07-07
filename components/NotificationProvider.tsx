'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface NotificationContextType {
  permission: NotificationPermission | null
  requestPermission: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  return (
    <NotificationContext.Provider value={{ permission, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  )
}
