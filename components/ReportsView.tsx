'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface ReportsViewProps {
  statuses: string[]
  leadSources: string[]
  managers: { id: string; name: string }[]
}

interface ReportRow {
  status: string
  count: number
  percentage: number
}

interface SourceRow {
  lead_source: string
  count: number
  percentage: number
}

interface ReportData {
  total: number
  byStatus: ReportRow[]
  bySource: SourceRow[]
  byManager: { manager_name: string; count: number; percentage: number }[]
  byStatusAndSource: { status: string; lead_source: string; count: number }[]
}

export default function ReportsView({ statuses, leadSources, managers }: ReportsViewProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const toggleSource = (s: string) => {
    setSelectedSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','))
    if (selectedSources.length > 0) params.set('sources', selectedSources.join(','))
    if (selectedManager) params.set('manager_id', selectedManager)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    return params.toString()
  }, [selectedStatuses, selectedSources, selectedManager, dateFrom, dateTo])

  const generateReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?${buildParams()}`)
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error('Report error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = () => {
    const params = buildParams()
    window.location.href = `/api/reports/export?${params}`
  }

  const selectAllStatuses = () => setSelectedStatuses(statuses.slice())
  const clearStatuses = () => setSelectedStatuses([])
  const selectAllSources = () => setSelectedSources(leadSources.slice())
  const clearSources = () => setSelectedSources([])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Отчёт</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">← Назад</Link>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Статусы</h2>
            <div className="flex gap-2 text-xs">
              <button onClick={selectAllStatuses} className="text-blue-600 hover:underline">Выбрать все</button>
              <button onClick={clearStatuses} className="text-gray-500 hover:underline">Очистить</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1 text-sm border rounded-full transition ${
                  selectedStatuses.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Источники</h2>
            <div className="flex gap-2 text-xs">
              <button onClick={selectAllSources} className="text-blue-600 hover:underline">Выбрать все</button>
              <button onClick={clearSources} className="text-gray-500 hover:underline">Очистить</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {leadSources.map((s) => (
              <button
                key={s}
                onClick={() => toggleSource(s)}
                className={`px-3 py-1 text-sm border rounded-full transition ${
                  selectedSources.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Менеджер</label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Все менеджеры</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Дата от</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Дата до</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Сформировать отчёт'}
          </button>
          {report && (
            <button
              onClick={exportExcel}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500"
            >
              Скачать Excel
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-bold mb-3">Сводка</h2>
            <div className="text-3xl font-bold text-blue-600">{report.total}</div>
            <div className="text-sm text-gray-500">всего кандидатов в выборке</div>
          </div>

          {/* By Status */}
          <div className="bg-white border rounded-lg overflow-x-auto">
            <h2 className="font-bold p-4 border-b">По статусам</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Статус</th>
                  <th className="p-3 text-right">Количество</th>
                  <th className="p-3 text-right">%</th>
                  <th className="p-3">Доля</th>
                </tr>
              </thead>
              <tbody>
                {report.byStatus.map((row) => (
                  <tr key={row.status} className="border-t">
                    <td className="p-3">{row.status}</td>
                    <td className="p-3 text-right font-medium">{row.count}</td>
                    <td className="p-3 text-right">{row.percentage.toFixed(1)}%</td>
                    <td className="p-3">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${Math.min(row.percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* By Source */}
          {report.bySource.length > 0 && (
            <div className="bg-white border rounded-lg overflow-x-auto">
              <h2 className="font-bold p-4 border-b">По источникам</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Источник</th>
                    <th className="p-3 text-right">Количество</th>
                    <th className="p-3 text-right">%</th>
                    <th className="p-3">Доля</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bySource.map((row) => (
                    <tr key={row.lead_source} className="border-t">
                      <td className="p-3 font-medium">{row.lead_source}</td>
                      <td className="p-3 text-right">{row.count}</td>
                      <td className="p-3 text-right">{row.percentage.toFixed(1)}%</td>
                      <td className="p-3">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-green-600 h-4 rounded-full"
                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* By Manager */}
          {report.byManager.length > 0 && (
            <div className="bg-white border rounded-lg overflow-x-auto">
              <h2 className="font-bold p-4 border-b">По менеджерам</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Менеджер</th>
                    <th className="p-3 text-right">Количество</th>
                    <th className="p-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byManager.map((row) => (
                    <tr key={row.manager_name} className="border-t">
                      <td className="p-3">{row.manager_name}</td>
                      <td className="p-3 text-right">{row.count}</td>
                      <td className="p-3 text-right">{row.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cross: Status × Source */}
          {report.byStatusAndSource.length > 0 && (
            <div className="bg-white border rounded-lg overflow-x-auto">
              <h2 className="font-bold p-4 border-b">Статусы × Источники</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Статус</th>
                    {report.bySource.map((s) => (
                      <th key={s.lead_source} className="p-3 text-right whitespace-nowrap">{s.lead_source}</th>
                    ))}
                    <th className="p-3 text-right font-bold">Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byStatus.map((st) => (
                    <tr key={st.status} className="border-t">
                      <td className="p-3">{st.status}</td>
                      {report.bySource.map((src) => {
                        const cell = report.byStatusAndSource.find(
                          (x) => x.status === st.status && x.lead_source === src.lead_source
                        )
                        return <td key={src.lead_source} className="p-3 text-right">{cell?.count || 0}</td>
                      })}
                      <td className="p-3 text-right font-bold">{st.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}