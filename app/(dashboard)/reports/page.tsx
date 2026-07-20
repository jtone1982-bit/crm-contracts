'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ManagerSearch } from '@/components/ManagerSearch'
import { PIPELINE_STATUSES } from '@/lib/types'

interface ReportData {
  total: number
  byStatus: { status: string; count: number; percentage: number }[]
  bySource: { lead_source: string; count: number; percentage: number }[]
  byManager: { manager_name: string; count: number; percentage: number }[]
  byStatusAndSource: { status: string; lead_source: string; count: number }[]
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [managerId, setManagerId] = useState<string | undefined>(undefined)
  const [managerName, setManagerName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sources, setSources] = useState<string[]>([])

  const ALL_SOURCES = ['ГКСштб8', 'ЗЩТ1', 'Регионы', 'НН', 'ККС', 'МСКп', 'КН']

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statuses.length > 0) params.set('statuses', statuses.join(','))
    if (sources.length > 0) params.set('sources', sources.join(','))
    if (managerId) params.set('manager_id', managerId)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)

    fetch(`/api/reports?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
          setData(null)
        } else {
          setData(d)
          setError('')
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [statuses, sources, managerId, dateFrom, dateTo])

  const toggleStatus = (status: string) => {
    setStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const toggleSource = (source: string) => {
    setSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    )
  }

  const exportUrl = () => {
    const params = new URLSearchParams()
    if (statuses.length > 0) params.set('statuses', statuses.join(','))
    if (sources.length > 0) params.set('sources', sources.join(','))
    if (managerId) params.set('manager_id', managerId)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    return `/api/reports/export?${params.toString()}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Отчёты</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Назад</Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Статусы</label>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1 text-sm border rounded-full ${
                  statuses.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Источники</label>
          <div className="flex flex-wrap gap-2">
            {ALL_SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => toggleSource(s)}
                className={`px-3 py-1 text-sm border rounded-full ${
                  sources.includes(s)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Менеджер</label>
            <ManagerSearch
              value={managerName}
              onSelect={(id, name) => {
                setManagerId(id)
                setManagerName(name || '')
              }}
              placeholder="Все менеджеры"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дата от</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дата до</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <a
          href={exportUrl()}
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500"
        >
          📊 Экспорт в Excel
        </a>
      </div>

      {loading && <div className="text-center text-gray-500">Загрузка...</div>}

      {!loading && data && (
        <>
          {/* Total */}
          <div className="bg-white border rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600">{data.total}</div>
            <div className="text-sm text-gray-600 mt-1">Всего кандидатов</div>
          </div>

          {/* By status */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-bold mb-3">По статусам</h2>
            <div className="space-y-2">
              {data.byStatus.map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-32 text-sm truncate">{s.status}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(s.percentage, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{s.count}</span>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-500 text-right">
                    {s.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By manager */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-bold mb-3">По менеджерам</h2>
            <div className="space-y-2">
              {data.byManager.map((m) => (
                <div key={m.manager_name} className="flex items-center gap-3">
                  <div className="w-40 text-sm truncate">{m.manager_name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(m.percentage, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{m.count}</span>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-500 text-right">
                    {m.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By source */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-bold mb-3">По источникам</h2>
            {data.bySource.length > 0 ? (
            <div className="space-y-2">
              {data.bySource.map((s) => (
                  <div key={s.lead_source} className="flex items-center gap-3">
                    <div className="w-32 text-sm truncate">{s.lead_source}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(s.percentage, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{s.count}</span>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-500 text-right">
                      {s.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Нет данных по источникам</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}