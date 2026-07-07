'use client'

import { useState, useRef, useEffect } from 'react'
import Picker from 'emoji-picker-react'

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void
}

export default function EmojiPickerButton({ onEmojiClick }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200"
      >
        😊
      </button>
      {open && (
        <div className="absolute bottom-12 right-0 z-50">
          <Picker
            onEmojiClick={(emojiData) => {
              onEmojiClick(emojiData.emoji)
              setOpen(false)
            }}
            searchPlaceholder="Поиск"
            skinTonesDisabled
            width={300}
            height={350}
          />
        </div>
      )}
    </div>
  )
}
