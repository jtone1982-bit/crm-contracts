'use client'

import { useState, useRef, useEffect } from 'react'
import { Portal } from './Portal'

interface PhoneActionsMenuProps {
  phone: string
  telegramUsername?: string | null
  whatsappNumber?: string | null
  maxContact?: string | null
  children: React.ReactNode
}

export function PhoneActionsMenu({
  phone,
  telegramUsername,
  whatsappNumber,
  maxContact,
  children,
}: PhoneActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    }
    setOpen((v) => !v)
  }

  const cleanPhone = phone.replace(/\D/g, '')
  const waNumber = (whatsappNumber || phone).replace(/\D/g, '')
  const waLink = `https://wa.me/${waNumber.replace(/^8/, '7')}`

  const tgUsername = telegramUsername?.replace(/^@/, '').trim()
  const tgLink = tgUsername
    ? `https://t.me/${tgUsername}`
    : `https://t.me/+${cleanPhone.replace(/^7/, '7')}`

  async function copyMax() {
    const text = maxContact || phone
    try {
      await navigator.clipboard.writeText(text)
      alert('Скопировано: ' + text)
    } catch {
      alert('Не удалось скопировать')
    }
  }

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <div
        onClick={handleToggle}
        className="cursor-pointer"
        role="button"
        aria-label="Действия с номером"
      >
        {children}
      </div>

      {open && (
        <Portal>
          <div
            className="fixed z-[100] mt-1 w-56 bg-white border rounded-lg shadow-lg py-1"
            style={{ top: position.top, left: position.left }}
          >
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              📞 Позвонить
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              💬 WhatsApp
            </a>
            <a
              href={tgLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              ✈️ Telegram
            </a>
            <button
              type="button"
              onClick={() => { copyMax(); setOpen(false) }}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              🔵 MAX — скопировать
            </button>
          </div>
        </Portal>
      )}
    </div>
  )
}
