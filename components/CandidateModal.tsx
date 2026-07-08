'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineStatus } from '@/lib/types'

interface CandidateFile {
  id: string
  file_type: string
  file_url: string
  file_name: string
}

interface Candidate {
  id: string
  phone: string
  full_name?: string | null
  birth_date?: string | null
  city_from?: string | null
  city_to?: string | null
  lead_source?: string | null
  health_group?: string | null
  diseases?: string | null
  scars?: string | null
  documents?: string | null
  is_officer?: boolean
  is_woman?: boolean
  is_commissioned?: boolean
  status: PipelineStatus
  notes?: string | null
  departure_date?: string | null
  next_contact_date?: string | null
}

interface CandidateModalProps {
  candidateId: string | null
  onClose: () => void
  statuses: PipelineStatus[]
}

export default function CandidateModal({ candidateId, onClose, statuses }: CandidateModalProps) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [files, setFiles] = useState<CandidateFile[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!candidateId) return
    setLoading(true)
    fetch(`/api/candidates/${candidateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.candidate) {
          setCandidate(data.candidate)
          setFiles(data.files || [])
        }
      })
      .finally(() => setLoading(false))
  }, [candidateId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!candidateId) return null

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!candidate) return

    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const body: Record<string, any> = {}

    const fields = [
      'full_name',
      'birth_date',
      'city_from',
      'city_to',
      'lead_source',
      'health_group',
      'diseases',
      'scars',
      'documents',
      'status',
      'notes',
      'departure_date',
      'next_contact_date',
    ]

    for (const field of fields) {
      body[field] = formData.get(field)?.toString() || null
    }

    body.is_officer = formData.get('is_officer') === 'on'
    body.is_woman = formData.get('is_woman') === 'on'
    body.is_commissioned = formData.get('is_commissioned') === 'on'

    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (res.ok) {
      router.refresh()
      onClose()
    } else {
      const data = await res.json()
      alert(data.error || 'Ошибка сохранения')
    }
  }

  async function uploadFiles(fileType: string, inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0 || !candidate) return

    setUploading(true)
    const formData = new FormData()
    formData.append('candidate_id', candidate.id)
    formData.append('file_type', fileType)
    Array.from(inputFiles).forEach((file) => formData.append('files', file))

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setUploading(false)

    if (res.ok) {
      setFiles((prev) => [...prev, ...data.uploaded])
    } else {
      alert(data.error || 'Ошибка загрузки')
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-lg shadow-xl min-h-full sm:min-h-0">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between sm:rounded-t-lg">
          <h2 className="text-lg font-bold">Карточка кандидата</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">×</button>
        </div>

        <div className="p-4">
          {loading && <div className="py-8 text-center text-gray-500">Загрузка...</div>}

          {!loading && candidate && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Телефон</label>
                  <input name="phone" defaultValue={candidate.phone} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">ФИО</label>
                  <input name="full_name" defaultValue={candidate.full_name || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Дата рождения</label>
                  <input name="birth_date" defaultValue={candidate.birth_date || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Откуда</label>
                  <input name="city_from" defaultValue={candidate.city_from || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Куда</label>
                  <input name="city_to" defaultValue={candidate.city_to || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Источник лида</label>
                  <input name="lead_source" defaultValue={candidate.lead_source || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Группа здоровья</label>
                  <input name="health_group" defaultValue={candidate.health_group || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Болезни</label>
                  <input name="diseases" defaultValue={candidate.diseases || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Шрамы</label>
                  <input name="scars" defaultValue={candidate.scars || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Документы</label>
                  <input name="documents" defaultValue={candidate.documents || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Статус</label>
                  <select name="status" defaultValue={candidate.status} className="w-full border rounded-lg px-3 py-2">
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Дата выезда</label>
                  <input name="departure_date" type="date" defaultValue={candidate.departure_date || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Следующий контакт</label>
                  <input name="next_contact_date" type="date" defaultValue={candidate.next_contact_date || ''} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input name="is_officer" type="checkbox" defaultChecked={candidate.is_officer} />
                  <span className="text-sm">Офицер</span>
                </label>
                <label className="flex items-center gap-2">
                  <input name="is_woman" type="checkbox" defaultChecked={candidate.is_woman} />
                  <span className="text-sm">Женщина</span>
                </label>
                <label className="flex items-center gap-2">
                  <input name="is_commissioned" type="checkbox" defaultChecked={candidate.is_commissioned} />
                  <span className="text-sm">Комиссованный</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Комментарии / история</label>
                <textarea name="notes" defaultValue={candidate.notes || ''} rows={3} className="w-full border rounded-lg px-3 py-2" />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Файлы</h3>

                {files.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline border p-2 rounded"
                      >
                        {file.file_type}: {file.file_name}
                      </a>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'scar_photo', label: 'Фото шрамов' },
                    { key: 'contract_photo', label: 'Фото контракта' },
                    { key: 'ticket', label: 'Билеты' },
                    { key: 'document', label: 'Документы' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-sm font-medium">{label}</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => uploadFiles(key, e.target.files)}
                        disabled={uploading}
                        className="w-full text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          {!loading && !candidate && <div className="py-8 text-center text-red-500">Кандидат не найден</div>}
        </div>
      </div>
    </div>
  )
}
