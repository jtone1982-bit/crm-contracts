'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PipelineStatus, PIPELINE_STATUSES } from '@/lib/types'
import CandidateModal from '@/components/CandidateModal'
import { PhoneActionsMenu } from '@/components/PhoneActionsMenu'

interface Candidate {
  id: string
  phone: string
  full_name?: string | null
  city_from?: string | null
  city_to?: string | null
  lead_source?: string | null
  next_contact_date?: string | null
  telegram_username?: string | null
  whatsapp_number?: string | null
  max_contact?: string | null
  manager?: { full_name: string | null } | { full_name: string | null }[] | null
}

interface CandidatesListProps {
  candidates: Candidate[]
  statusFilter?: string
  isAdmin?: boolean
  leadSources?: string[]
  activeSource?: string
}

export default function CandidatesList({ candidates, statusFilter, isAdmin, leadSources, activeSource }: CandidatesListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const getManagerName = (c: Candidate): string => {
    if (!c.manager) return '—'
    if (Array.isArray(c.manager)) return c.manager[0]?.full_name || '—'
    return c.manager.full_name || '—'
  }

  return (
    <div className="space-y-4">
      <CandidateModal candidateId={selectedId} onClose={() => setSelectedId(null)} statuses={PIPELINE_STATUSES.slice()} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{statusFilter ? statusFilter : 'Все кандидаты'}</h1>
        <a href="/" className="text-blue-600 hover:underline">← Назад</a>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/candidates" className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50">Все</Link>
        {PIPELINE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/candidates?status=${encodeURIComponent(status)}`}
            className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${statusFilter === status ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            {status}
          </Link>
        ))}
      </div>

      {isAdmin && leadSources && leadSources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Источник:</span>
          <Link
            href={`/candidates${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''}`}
            className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${!activeSource ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            Все
          </Link>
          {leadSources.map((src) => {
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            if (src !== activeSource) params.set('source', src)
            const href = `/candidates${params.toString() ? `?${params.toString()}` : ''}`
            return (
              <Link
                key={src}
                href={href}
                className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${activeSource === src ? 'bg-blue-100 border-blue-300' : ''}`}
              >
                {src}
              </Link>
            )
          })}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Телефон</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Откуда</th>
              <th className="p-3">Куда</th>
              {isAdmin && <th className="p-3">Источник</th>}
              <th className="p-3">Менеджер</th>
              <th className="p-3">Следующий контакт</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {candidates?.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className="text-blue-600 hover:underline text-left"
                    >
                      {c.phone}
                    </button>
                    <PhoneActionsMenu
                      phone={c.phone}
                      telegramUsername={c.telegram_username}
                      whatsappNumber={c.whatsapp_number}
                      maxContact={c.max_contact}
                    >
                      <button
                        type="button"
                        className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                        aria-label="Действия с номером"
                      >
                        📞
                      </button>
                    </PhoneActionsMenu>
                  </div>
                </td>
                <td className="p-3">{c.full_name || '—'}</td>
                <td className="p-3">{c.city_from || '—'}</td>
                <td className="p-3">{c.city_to || '—'}</td>
                {isAdmin && <td className="p-3 text-xs">{c.lead_source || '—'}</td>}
                <td className="p-3 text-sm">{getManagerName(c)}</td>
                <td className="p-3">{c.next_contact_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        <div className="md:hidden space-y-3">
        {candidates?.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="block w-full text-left bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            role="button"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-blue-600 font-medium"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(c.id)
                  }}
                >
                  {c.phone}
                </button>
                <PhoneActionsMenu
                  phone={c.phone}
                  telegramUsername={c.telegram_username}
                  whatsappNumber={c.whatsapp_number}
                  maxContact={c.max_contact}
                >
                  <button
                    type="button"
                    className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                    aria-label="Действия с номером"
                  >
                    📞
                  </button>
                </PhoneActionsMenu>
              </div>
              <span className="text-xs text-gray-500">{c.next_contact_date || '—'}</span>
            </div>
            <div className="mt-2 text-sm text-gray-900">{c.full_name || '—'}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <span>{c.city_from || '—'} → {c.city_to || '—'}</span>
              {isAdmin && c.lead_source && (
                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">{c.lead_source}</span>
              )}
            </div>
            {getManagerName(c) !== '—' && (
              <div className="mt-1 text-xs text-gray-500">Менеджер: {getManagerName(c)}</div>
            )}
          </div>
        ))}
      </div>

      {(!candidates || candidates.length === 0) && (
        <div className="p-8 text-center text-gray-500">Нет кандидатов</div>
      )}
    </div>
  )
}
