'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PipelineStatus, PIPELINE_STATUSES, Candidate } from '@/lib/types'
import ExcelImportButton from '@/components/ExcelImportButton'
import UnreadBadge from '@/components/UnreadBadge'
import CandidateModal from '@/components/CandidateModal'
import { PhoneActionsMenu } from '@/components/PhoneActionsMenu'
import { DepartmentFilter } from '@/components/DepartmentFilter'
import { ManagerSearch } from '@/components/ManagerSearch'

interface Profile {
  role: string
}

export default function CandidatesDashboard({ profile, departments }: { profile: Profile; departments: { id: string; name: string }[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [managerId, setManagerId] = useState<string | undefined>(undefined)
  const [managerName, setManagerName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (departmentId) params.append('department_id', departmentId)
    if (managerId) params.append('manager_id', managerId)
    if (search) params.append('q', search)

    fetch(`/api/candidates?${params.toString()}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = '/login'
          return []
        }
        return r.json()
      })
      .then((data) => setCandidates(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [departmentId, managerId, search])

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
              <Link href="/calendar" className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50">
                Календарь
              </Link>
              <Link href="/tools" className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50">
                Инструменты
              </Link>
              <Link href="/messages" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 flex items-center">
                Чат
                <UnreadBadge />
              </Link>
              <a href="/api/export" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">
                Экспорт Excel
              </a>
              <Link href="/reports" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                Отчёт
              </Link>
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

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setManagerId(undefined)
            setManagerName('')
          }}
          placeholder="Поиск по ФИО или телефону"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        {profile.role === 'admin' && (
          <>
            <DepartmentFilter value={departmentId} onChange={setDepartmentId} departments={departments} />
            <div className="w-full sm:w-64">
              <ManagerSearch
                value={managerName}
                onSelect={(id, name) => {
                  setManagerId(id)
                  setManagerName(name || '')
                  setSearch('')
                }}
                placeholder="Поиск по фамилии менеджера"
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {PIPELINE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/candidates?status=${encodeURIComponent(status)}${departmentId ? `&department_id=${departmentId}` : ''}${managerId ? `&manager_id=${managerId}` : ''}`}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="text-2xl font-bold text-blue-600">{byStatus[status] || 0}</div>
            <div className="text-sm text-gray-600 mt-1">{status}</div>
          </Link>
        ))}
      </div>

      {loading && <div className="text-center text-gray-500">Загрузка...</div>}

      {!loading && (
        <>
          <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100 text-left text-sm">
                <tr>
                  <th className="p-3">Телефон</th>
                  <th className="p-3">ФИО</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3">Куда</th>
                  <th className="p-3">Менеджер</th>
                  <th className="p-3">Дата создания</th>
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
                    <td className="p-3">{c.status}</td>
                    <td className="p-3">{c.city_to || '—'}</td>
                    <td className="p-3">{c.manager?.full_name || '—'}</td>
                    <td className="p-3">{new Date(c.created_at || '').toLocaleDateString('ru-RU')}</td>
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
                  <span className="text-xs text-gray-500">{new Date(c.created_at || '').toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="mt-2 text-sm text-gray-900">{c.full_name || '—'}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                  <span className="px-2 py-0.5 bg-gray-100 rounded">{c.status}</span>
                  <span>→ {c.city_to || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(!candidates || candidates.length === 0) && !loading && (
        <div className="p-8 text-center text-gray-500">Нет кандидатов</div>
      )}
    </div>
  )
}
