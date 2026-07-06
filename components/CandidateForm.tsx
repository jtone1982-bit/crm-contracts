'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineStatus } from '@/lib/types'

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
  candidate_files?: { id: string; file_type: string; file_url: string; file_name: string }[]
}

export function CandidateForm({
  candidate,
  statuses,
  onSubmit,
}: {
  candidate: Candidate
  statuses: PipelineStatus[]
  onSubmit: (formData: FormData) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState(candidate.candidate_files || [])
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  async function uploadFiles(fileType: string, inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return

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
      router.refresh()
    } else {
      alert(data.error || 'Ошибка загрузки')
    }
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Телефон</label>
          <input name="phone" defaultValue={candidate.phone} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">ФИО</label>
          <input name="full_name" defaultValue={candidate.full_name || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Дата рождения</label>
          <input name="birth_date" defaultValue={candidate.birth_date || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Откуда</label>
          <input name="city_from" defaultValue={candidate.city_from || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Куда</label>
          <input name="city_to" defaultValue={candidate.city_to || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Источник лида</label>
          <input name="lead_source" defaultValue={candidate.lead_source || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Группа здоровья</label>
          <input name="health_group" defaultValue={candidate.health_group || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Болезни</label>
          <input name="diseases" defaultValue={candidate.diseases || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Шрамы</label>
          <input name="scars" defaultValue={candidate.scars || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Документы</label>
          <input name="documents" defaultValue={candidate.documents || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Статус</label>
          <select name="status" defaultValue={candidate.status} className="w-full border rounded-lg px-3 py-2">
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Дата выезда</label>
          <input name="departure_date" type="date" defaultValue={candidate.departure_date || ''} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="space-y-2">
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

      <div className="space-y-2">
        <label className="block text-sm font-medium">Комментарии / история</label>
        <textarea name="notes" defaultValue={candidate.notes || ''} rows={4} className="w-full border rounded-lg px-3 py-2" />
      </div>

      <div className="space-y-4">
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

      <button
        type="submit"
        className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
      >
        Сохранить
      </button>
    </form>
  )
}
