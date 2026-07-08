'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Candidate,
  PipelineStatus,
  DISEASES,
  HEALTH_GROUPS,
  DOCUMENTS,
  CRIMINAL_RECORDS,
  DRIVER_LICENSES,
  FAMILY_RELATIONS,
  CITIZEN_OPTIONS,
  YES_NO,
  FAILURE_REASONS,
  FAILURE_TO_STATUS,
  CandidateFile,
} from '@/lib/types'

interface CandidateFormProps {
  candidate: Candidate
  statuses: PipelineStatus[]
  onSubmit: (formData: FormData) => void
}

export function CandidateForm({ candidate, statuses, onSubmit }: CandidateFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<CandidateFile[]>(candidate.candidate_files || [])
  const [status, setStatus] = useState<PipelineStatus>(candidate.status)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<PipelineStatus | null>(null)
  const [failureReason, setFailureReason] = useState(candidate.reason_for_failure || '')
  const [failureComment, setFailureComment] = useState(candidate.failure_comment || '')
  const [diseases, setDiseases] = useState<string[]>(candidate.diseases || [])
  const [documents, setDocuments] = useState<string[]>(candidate.documents || [])

  // Open failure modal when status changes to 'Недозвон'
  useEffect(() => {
    if (status === 'Недозвон' && candidate.status !== 'Недозвон') {
      setPendingStatus('Недозвон')
      setShowFailureModal(true)
    }
  }, [status, candidate.status])

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as PipelineStatus
    setStatus(newStatus)
  }

  function confirmFailure() {
    if (!failureReason) return
    const autoStatus = FAILURE_TO_STATUS[failureReason]
    if (autoStatus) {
      setStatus(autoStatus)
    }
    setShowFailureModal(false)
    setPendingStatus(null)
  }

  function cancelFailure() {
    // Revert status selection to previous candidate status
    setStatus(candidate.status)
    setShowFailureModal(false)
    setPendingStatus(null)
  }

  function toggleMultiSelect(value: string, current: string[], setter: (v: string[]) => void) {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value))
    } else {
      setter([...current, value])
    }
  }

  async function uploadFiles(fileType: string, inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return
    setUploading(true)
    const formData = new FormData()
    formData.append('candidate_id', candidate.id)
    formData.append('file_type', fileType)
    Array.from(inputFiles).forEach((file) => formData.append('files', file))

    const res = await fetch('/api/files/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)

    if (res.ok) {
      setFiles((prev) => [...prev, ...data.uploaded])
      router.refresh()
    } else {
      alert(data.error || 'Ошибка загрузки')
    }
  }

  function renderSelect(name: string, options: string[], value?: string | null, label?: string) {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium">{label}</label>}
        <select name={name} defaultValue={value || ''} className="w-full border rounded-lg px-3 py-2">
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  function renderInput(name: string, value?: string | null, label?: string, type: string = 'text') {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium">{label}</label>}
        <input name={name} type={type} defaultValue={value || ''} className="w-full border rounded-lg px-3 py-2" />
      </div>
    )
  }

  function renderTextarea(name: string, value?: string | null, label?: string, rows: number = 3) {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium">{label}</label>}
        <textarea name={name} defaultValue={value || ''} rows={rows} className="w-full border rounded-lg px-3 py-2" />
      </div>
    )
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-6">
      {/* Hidden fields for multi-select state */}
      <input type="hidden" name="diseases" value={JSON.stringify(diseases)} />
      <input type="hidden" name="documents" value={JSON.stringify(documents)} />
      <input type="hidden" name="reason_for_failure" value={failureReason} />
      <input type="hidden" name="failure_comment" value={failureComment} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('phone', candidate.phone, 'Телефон')}
        {renderInput('full_name', candidate.full_name, 'ФИО')}
        {renderInput('birth_date', candidate.birth_date || '', 'Дата рождения', 'date')}
        {renderInput('age', candidate.age, 'Возраст')}
        {renderSelect('citizen_rf', CITIZEN_OPTIONS, candidate.citizen_rf, 'Гражданин РФ')}
        {renderSelect('is_officer', YES_NO, candidate.is_officer ? 'Да' : candidate.is_officer === false ? 'Нет' : '', 'Офицер')}
        {renderSelect('is_woman', YES_NO, candidate.is_woman ? 'Да' : candidate.is_woman === false ? 'Нет' : '', 'Женщина')}
        {renderSelect('is_commissioned', YES_NO, candidate.is_commissioned ? 'Да' : candidate.is_commissioned === false ? 'Нет' : '', 'Комиссованный')}
        {renderInput('city_from', candidate.city_from, 'Город выезда')}
        {renderInput('city_to', candidate.city_to, 'Город прибытия')}
        {renderInput('lead_source', candidate.lead_source, 'Источник')}
        {renderSelect('health_group', HEALTH_GROUPS, candidate.health_group, 'Группа здоровья')}
        {renderInput('health_group_reason', candidate.health_group_reason, 'Причина группы В,Г,Д')}
        {renderSelect('scars', YES_NO, candidate.scars, 'Наличие шрамов')}
        {renderInput('other_health_issues', candidate.other_health_issues, 'Другие проблемы по здоровью')}
        {renderSelect('criminal_record', CRIMINAL_RECORDS, candidate.criminal_record, 'Судимость')}
        {renderInput('criminal_article', candidate.criminal_article, 'Статья судимости')}
        {renderSelect('driver_license', DRIVER_LICENSES, candidate.driver_license, 'Водительские права')}
        {renderSelect('family_relation', FAMILY_RELATIONS, candidate.family_relation, 'Отношение')}
        {renderInput('departure_date', candidate.departure_date || '', 'Дата выезда', 'date')}
        {renderInput('departure_datetime', candidate.departure_datetime || '', 'Дата и время выезда', 'datetime-local')}
        {renderInput('next_contact_date', candidate.next_contact_date || '', 'Следующий контакт', 'date')}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Болезни (множественный выбор)</label>
        <div className="flex flex-wrap gap-3">
          {DISEASES.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={diseases.includes(d)}
                onChange={() => toggleMultiSelect(d, diseases, setDiseases)}
              />
              {d}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Документы (множественный выбор)</label>
        <div className="flex flex-wrap gap-3">
          {DOCUMENTS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={documents.includes(d)}
                onChange={() => toggleMultiSelect(d, documents, setDocuments)}
              />
              {d}
            </label>
          ))}
        </div>
      </div>

      {renderTextarea('foreign_documents', candidate.foreign_documents, 'Документы (иностранец)')}
      {renderTextarea('notes', candidate.notes, 'Комментарии / история', 4)}
      {renderTextarea('comments', candidate.comments, 'Комментарий к анкете', 3)}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Статус</label>
        <select
          name="status"
          value={status}
          onChange={handleStatusChange}
          className="w-full border rounded-lg px-3 py-2"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
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
            { key: 'ticket', label: 'Билеты (файлы)' },
            { key: 'contract', label: 'Контракт' },
            { key: 'scar_photo', label: 'Фото шрамов' },
            { key: 'document_scan', label: 'Сканы документов' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium">{label}</label>
              <input type="file" multiple onChange={(e) => uploadFiles(key, e.target.files)} disabled={uploading} className="w-full text-sm" />
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

      {/* Failure reason modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="font-medium text-lg">Причина провала</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Выберите причину</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">—</option>
                {FAILURE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Комментарий</label>
              <textarea
                value={failureComment}
                onChange={(e) => setFailureComment(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={cancelFailure} className="px-4 py-2 border rounded-lg">Отмена</button>
              <button
                type="button"
                onClick={confirmFailure}
                disabled={!failureReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
