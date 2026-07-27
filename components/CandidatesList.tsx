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
  manager_id?: string | null
}

interface Manager {
  id: string
  full_name: string | null
  role: string
}

interface CandidatesListProps {
  candidates: Candidate[]
  statusFilter?: string
  isAdmin?: boolean
  leadSources?: string[]
  activeSource?: string
  managers?: Manager[]
  activeManagerId?: string
}

export default function CandidatesList({ candidates, statusFilter, isAdmin, leadSources, activeSource, managers, activeManagerId }: CandidatesListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [transferManagerId, setTransferManagerId] = useState<string>('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferMessage, setTransferMessage] = useState<string | null>(null)
  const [bulkFromManagerId, setBulkFromManagerId] = useState<string>('')
  const [bulkToManagerId, setBulkToManagerId] = useState<string>('')
  const [sortField, setSortField] = useState<'phone' | 'full_name' | 'city_from' | 'city_to' | 'lead_source' | 'manager' | 'next_contact_date'>('next_contact_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const getManagerName = (c: Candidate): string => {
    if (!c.manager) return '—'
    if (Array.isArray(c.manager)) return c.manager[0]?.full_name || '—'
    return c.manager.full_name || '—'
  }

  const sortedCandidates = [...(candidates || [])].sort((a, b) => {
    let aVal = ''
    let bVal = ''
    switch (sortField) {
      case 'phone': aVal = a.phone || ''; bVal = b.phone || ''; break
      case 'full_name': aVal = a.full_name || ''; bVal = b.full_name || ''; break
      case 'city_from': aVal = a.city_from || ''; bVal = b.city_from || ''; break
      case 'city_to': aVal = a.city_to || ''; bVal = b.city_to || ''; break
      case 'lead_source': aVal = a.lead_source || ''; bVal = b.lead_source || ''; break
      case 'manager': aVal = getManagerName(a); bVal = getManagerName(b); break
      case 'next_contact_date': aVal = a.next_contact_date || ''; bVal = b.next_contact_date || ''; break
    }
    if (aVal === bVal) return 0
    const cmp = aVal.localeCompare(bVal, 'ru')
    return sortDir === 'asc' ? cmp : -cmp
  })

  const allIds = sortedCandidates.map((c) => c.id)
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds)
      allIds.forEach((id) => next.delete(id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      allIds.forEach((id) => next.add(id))
      setSelectedIds(next)
    }
  }

  const handleTransfer = async () => {
    if (!transferManagerId || selectedIds.size === 0) return
    setTransferLoading(true)
    setTransferMessage(null)
    try {
      const res = await fetch('/api/candidates/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: Array.from(selectedIds), managerId: transferManagerId }),
      })
      const json = await res.json()
      if (res.ok) {
        setTransferMessage(`Перенесено ${json.updated} кандидатов`)
        setSelectedIds(new Set())
        setTimeout(() => window.location.reload(), 600)
      } else {
        setTransferMessage(json.error || 'Ошибка переноса')
      }
    } catch (e) {
      setTransferMessage('Ошибка сети')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleBulkTransfer = async () => {
    if (!bulkFromManagerId || !bulkToManagerId || bulkFromManagerId === bulkToManagerId) return
    setTransferLoading(true)
    setTransferMessage(null)
    try {
      const res = await fetch('/api/candidates/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromManagerId: bulkFromManagerId, managerId: bulkToManagerId }),
      })
      const json = await res.json()
      if (res.ok) {
        setTransferMessage(`Перенесено ${json.updated} кандидатов`)
        setBulkFromManagerId('')
        setBulkToManagerId('')
        setTimeout(() => window.location.reload(), 600)
      } else {
        setTransferMessage(json.error || 'Ошибка переноса')
      }
    } catch (e) {
      setTransferMessage('Ошибка сети')
    } finally {
      setTransferLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <CandidateModal candidateId={selectedId} onClose={() => setSelectedId(null)} statuses={PIPELINE_STATUSES.slice()} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#2d2520' }}>{statusFilter ? statusFilter : 'Все кандидаты'}</h1>
        <a href="/" className="hover:underline" style={{ color: '#c2410c' }}>← Назад</a>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-[#fefdfb] border rounded-xl p-3" style={{ borderColor: 'rgba(60,50,40,0.08)' }}>
        <span className="text-sm font-medium" style={{ color: '#2d2520' }}>Выбрано: {selectedIds.size}</span>
        <select
          className="text-sm border rounded-lg px-2 py-1"
          style={{ borderColor: 'rgba(60,50,40,0.12)' }}
          value={transferManagerId}
          onChange={(e) => setTransferManagerId(e.target.value)}
          disabled={!managers || managers.length === 0}
        >
          <option value="">Выберите менеджера</option>
          {(managers || []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name || '—'} {m.role === 'admin' ? '(админ)' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={handleTransfer}
          disabled={transferLoading || selectedIds.size === 0 || !transferManagerId}
          className="text-sm px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
          style={{ background: '#c2410c' }}
        >
          {transferLoading ? 'Перенос...' : 'Перенести выбранных'}
        </button>
      </div>

      {(isAdmin || (managers?.length || 0) > 1) && (
        <div className="flex flex-wrap items-center gap-3 bg-[#fefdfb] border rounded-xl p-3" style={{ borderColor: 'rgba(60,50,40,0.08)' }}>
          <span className="text-sm font-medium" style={{ color: '#2d2520' }}>Перенести всех от менеджера:</span>
          <select
            className="text-sm border rounded-lg px-2 py-1"
            style={{ borderColor: 'rgba(60,50,40,0.12)' }}
            value={bulkFromManagerId}
            onChange={(e) => setBulkFromManagerId(e.target.value)}
          >
            <option value="">От кого</option>
            {(managers || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || '—'} {m.role === 'admin' ? '(админ)' : ''}
              </option>
            ))}
          </select>
          <span className="text-sm" style={{ color: '#6b5d50' }}>→</span>
          <select
            className="text-sm border rounded-lg px-2 py-1"
            style={{ borderColor: 'rgba(60,50,40,0.12)' }}
            value={bulkToManagerId}
            onChange={(e) => setBulkToManagerId(e.target.value)}
          >
            <option value="">Кому</option>
            {(managers || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || '—'} {m.role === 'admin' ? '(админ)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkTransfer}
            disabled={transferLoading || !bulkFromManagerId || !bulkToManagerId || bulkFromManagerId === bulkToManagerId}
            className="text-sm px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ background: '#c2410c' }}
          >
            {transferLoading ? 'Перенос...' : 'Перенести всех'}
          </button>
        </div>
      )}

      {transferMessage && <span className="text-sm" style={{ color: transferMessage.includes('Ошибка') ? '#dc2626' : '#16a34a' }}>{transferMessage}</span>}

      <div className="flex flex-wrap gap-2">
        <Link href="/candidates" className="px-3 py-1 text-sm border rounded-full hover:shadow-sm transition no-underline" style={{ borderColor: 'rgba(60,50,40,0.12)', color: '#6b5d50', background: '#fefdfb' }}>Все</Link>
        {PIPELINE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/candidates?status=${encodeURIComponent(status)}`}
            className="px-3 py-1 text-sm border rounded-full hover:shadow-sm transition no-underline"
            style={statusFilter === status ? { background: '#c2410c', color: 'white', borderColor: '#c2410c' } : { borderColor: 'rgba(60,50,40,0.12)', color: '#6b5d50', background: '#fefdfb' }}
          >
            {status}
          </Link>
        ))}
      </div>

      {isAdmin && managers && managers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Менеджер:</span>
          <Link
            href={`/candidates${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''}${activeSource ? (statusFilter ? `&source=${encodeURIComponent(activeSource)}` : `?source=${encodeURIComponent(activeSource)}`) : ''}`}
            className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${!activeManagerId ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            Все
          </Link>
          {managers.map((m) => {
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            if (activeSource) params.set('source', activeSource)
            if (m.id !== activeManagerId) params.set('manager_id', m.id)
            const href = `/candidates${params.toString() ? `?${params.toString()}` : ''}`
            return (
              <Link
                key={m.id}
                href={href}
                className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${activeManagerId === m.id ? 'bg-blue-100 border-blue-300' : ''}`}
              >
                {m.full_name || '—'}
              </Link>
            )
          })}
        </div>
      )}

      {isAdmin && leadSources && leadSources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Источник:</span>
          <Link
            href={`/candidates${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''}${activeManagerId ? (statusFilter ? `&manager_id=${activeManagerId}` : `?manager_id=${activeManagerId}`) : ''}`}
            className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${!activeSource ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            Все
          </Link>
          {leadSources.map((src) => {
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            if (activeManagerId) params.set('manager_id', activeManagerId)
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

      <div className="bg-[#fefdfb] border rounded-xl overflow-x-auto hidden md:block" style={{ borderColor: 'rgba(60,50,40,0.08)' }}>
        <table className="w-full min-w-[600px]">
          <thead className="text-left text-sm" style={{ background: 'rgba(240,235,227,0.6)' }}>
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  aria-label="Выбрать всех"
                />
              </th>
              <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('phone')}>Телефон {sortField === 'phone' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('full_name')}>ФИО {sortField === 'full_name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('city_from')}>Откуда {sortField === 'city_from' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('city_to')}>Куда {sortField === 'city_to' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              {isAdmin && <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('lead_source')}>Источник {sortField === 'lead_source' && (sortDir === 'asc' ? '↑' : '↓')}</th>}
              <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('manager')}>Менеджер {sortField === 'manager' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="p-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort('next_contact_date')}>Следующий контакт {sortField === 'next_contact_date' && (sortDir === 'asc' ? '↑' : '↓')}</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sortedCandidates.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelection(c.id)}
                    aria-label={`Выбрать ${c.full_name || c.phone}`}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className="hover:underline text-left font-semibold"
                      style={{ color: '#2d2520' }}
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
                        className="p-1 rounded transition hover:shadow-sm"
                        style={{ color: '#a89a8c' }}
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
        {sortedCandidates.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="block w-full text-left bg-[#fefdfb] border rounded-xl p-4 hover:shadow-md transition cursor-pointer no-underline"
            style={{ borderColor: 'rgba(60,50,40,0.08)' }}
            role="button"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="font-semibold"
                  style={{ color: '#2d2520' }}
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
                    className="p-1 rounded transition hover:shadow-sm"
                    style={{ color: '#a89a8c' }}
                    aria-label="Действия с номером"
                  >
                    📞
                  </button>
                </PhoneActionsMenu>
              </div>
              <span className="text-xs" style={{ color: '#a89a8c' }}>{c.next_contact_date || '—'}</span>
            </div>
            <div className="mt-2 text-sm" style={{ color: '#2d2520' }}>{c.full_name || '—'}</div>
            <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: '#6b5d50' }}>
              <span>{c.city_from || '—'} → {c.city_to || '—'}</span>
            </div>
            {getManagerName(c) !== '—' && (
              <div className="mt-1 text-xs" style={{ color: '#a89a8c' }}>Менеджер: {getManagerName(c)}</div>
            )}
          </div>
        ))}
      </div>

      {(!candidates || candidates.length === 0) && (
        <div className="p-8 text-center" style={{ color: '#a89a8c' }}>Нет кандидатов</div>
      )}
    </div>
  )
}
