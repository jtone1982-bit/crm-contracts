'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DepartmentFilter } from '@/components/DepartmentFilter'
import { ManagerSearch } from '@/components/ManagerSearch'
import CandidateModal from '@/components/CandidateModal'
import { PIPELINE_STATUSES } from '@/lib/types'

interface CalendarCandidate {
  id: string
  phone: string
  full_name?: string | null
  status?: string
  city_to?: string | null
  departure_datetime?: string
  manager?: { full_name?: string | null }
}

const STATUS_COLORS: Record<string, string> = {
  'На билетах': 'bg-yellow-100 border-yellow-300 text-yellow-900',
  'На оформлении': 'bg-orange-100 border-orange-300 text-orange-900',
  'Подписал': 'bg-green-100 border-green-300 text-green-900',
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateKey(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatRuDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function CalendarPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CalendarCandidate[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'month'>('week')
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [managerId, setManagerId] = useState<string | undefined>(undefined)
  const [managerName, setManagerName] = useState('')

  const weekStart = startOfWeek(currentDate)
  const days = useMemo(() => {
    if (view === 'week') {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const start = startOfWeek(firstDay)
    const end = addDays(startOfWeek(lastDay), 6)
    const result: Date[] = []
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      result.push(new Date(d))
    }
    return result
  }, [currentDate, view])

  useEffect(() => {
    const from = formatDateKey(days[0])
    const to = formatDateKey(days[days.length - 1])
    const params = new URLSearchParams()
    params.append('from', from)
    params.append('to', to)
    if (departmentId) params.append('department_id', departmentId)
    if (managerId) params.append('manager_id', managerId)

    fetch(`/api/calendar?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setCandidates(data || []))
  }, [days, departmentId, managerId])

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarCandidate[]>()
    for (const c of candidates) {
      if (!c.departure_datetime) continue
      const key = c.departure_datetime.split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return map
  }, [candidates])

  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(new Date())
  const isCurrentMonth = (d: Date) => d.getMonth() === currentDate.getMonth()

  return (
    <div className="space-y-4">
      <CandidateModal candidateId={selectedId} onClose={() => setSelectedId(null)} statuses={PIPELINE_STATUSES.slice()} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate((d) => (view === 'week' ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)))}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">
            {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </h1>
          <button
            onClick={() => setCurrentDate((d) => (view === 'week' ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)))}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            →
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            Сегодня
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DepartmentFilter value={departmentId} onChange={setDepartmentId} />
          <div className="w-48">
            <ManagerSearch
              value={managerName}
              onSelect={(id, name) => {
                setManagerId(id)
                setManagerName(name || '')
              }}
              placeholder="Менеджер"
            />
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-2 text-sm ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Неделя
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-2 text-sm ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Месяц
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-1 ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7 auto-rows-fr'}`}>
        {days.map((d) => {
          const key = formatDateKey(d)
          const list = byDay.get(key) || []
          return (
            <div
              key={key}
              onClick={() => {
                if (list.length === 1) setSelectedId(list[0].id)
              }}
              className={`border rounded-lg p-2 min-h-[120px] flex flex-col gap-1 cursor-pointer transition ${
                isToday(d) ? 'bg-blue-50 border-blue-300' : 'bg-white hover:shadow-md'
              } ${view === 'month' && !isCurrentMonth(d) ? 'opacity-50' : ''}`}
            >
              <div className="text-xs font-medium text-gray-500">{formatRuDate(d)}</div>
              {list.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(c.id)
                  }}
                  className={`text-left text-xs border rounded px-2 py-1 truncate ${
                    STATUS_COLORS[c.status || ''] || 'bg-blue-100 border-blue-300 text-blue-900'
                  }`}
                >
                  <div className="font-medium truncate">{c.full_name || c.phone}</div>
                  <div className="truncate opacity-80">{c.status}{c.city_to ? ` → ${c.city_to}` : ''}</div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
