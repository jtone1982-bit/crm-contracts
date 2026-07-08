'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PipelineStatus, PIPELINE_STATUSES } from '@/lib/types'
import ExcelImportButton from '@/components/ExcelImportButton'
import UnreadBadge from '@/components/UnreadBadge'
import CandidateModal from '@/components/CandidateModal'

interface Candidate {
  id: string
  phone: string
  full_name?: string | null
  status: PipelineStatus
  city_to?: string | null
  created_at: string
}

interface Profile {
  role: string
}

export default function CandidatesDashboard({ candidates, profile }: { candidates: Candidate[]; profile: Profile }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const byStatus = PIPELINE_STATUSES.reduce((acc, status) => {
    acc[status] = candidates?.filter((c) => c.status === status).length || 0
    return acc
  }, {} as Record<PipelineStatus, number>)

  return (
    <div className="space-y-6">
      <CandidateModal candidateId={selectedId} onClose={() => setSelectedId(null)} statuses={PIPELINE_STATUSES.slice()} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Кандидаты</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile" className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50">
            Профиль
          </Link>
          {profile.role === 'admin' && (
            <>
              <Link href="/admin/managers" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">
                Менеджеры
              </Link>
              <Link href="/messages" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 flex items-center">
                Чат
                <UnreadBadge />
              </Link>
              <a href="/api/export" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">
                Экспорт Excel
              </a>
              <form action="/api/import" method="get">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
                  Импорт из Sheets
                </button>
              </form>
              <ExcelImportButton />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {PIPELINE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/candidates?status=${encodeURIComponent(status)}`}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="text-2xl font-bold text-blue-600">{byStatus[status] || 0}</div>
            <div className="text-sm text-gray-600 mt-1">{status}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Телефон</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Куда</th>
              <th className="p-3">Дата создания</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {candidates?.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className="text-blue-600 hover:underline text-left"
                  >
                    {c.phone}
                  </button>
                </td>
                <td className="p-3">{c.full_name || '—'}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{c.city_to || '—'}</td>
                <td className="p-3">{new Date(c.created_at).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {candidates?.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="block w-full text-left bg-white border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-medium">{c.phone}</span>
              <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="mt-2 text-sm text-gray-900">{c.full_name || '—'}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-0.5 bg-gray-100 rounded">{c.status}</span>
              <span>→ {c.city_to || '—'}</span>
            </div>
          </button>
        ))}
      </div>

      {(!candidates || candidates.length === 0) && (
        <div className="p-8 text-center text-gray-500">Нет кандидатов</div>
      )}
    </div>
  )
}
