'use client'

import { useEffect, useState } from 'react'

interface Manager {
  id: string
  full_name: string | null
}

interface ManagerSearchProps {
  value: string
  onSelect: (managerId: string, managerName?: string) => void
  placeholder?: string
}

export function ManagerSearch({ value, onSelect, placeholder }: ManagerSearchProps) {
  const [query, setQuery] = useState(value)
  const [managers, setManagers] = useState<Manager[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setManagers([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/managers/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          setManagers(data || [])
          setOpen(true)
        })
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || 'Фамилия менеджера...'}
        className="w-full border rounded-lg px-3 py-2"
        onFocus={() => query.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && managers.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {managers.map((m) => (
            <button
              key={m.id}
              type="button"
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => {
              setQuery(m.full_name || '')
              onSelect(m.id, m.full_name || '')
              setOpen(false)
              }}
            >
              {m.full_name || '—'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
