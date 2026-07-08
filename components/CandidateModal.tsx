'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CandidateForm } from '@/components/CandidateForm'
import { Candidate, PipelineStatus } from '@/lib/types'

interface CandidateModalProps {
  candidateId: string | null
  onClose: () => void
  statuses: PipelineStatus[]
}

export default function CandidateModal({ candidateId, onClose, statuses }: CandidateModalProps) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!candidateId) return
    setLoading(true)
    fetch(`/api/candidates/${candidateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setCandidate(data)
        } else {
          setCandidate(null)
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

  async function handleSubmit(formData: FormData) {
    if (!candidate) return
    setSaving(true)

    const body: Record<string, any> = {}
    formData.forEach((value, key) => {
      body[key] = value.toString()
    })

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4 overflow-hidden"
    >
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-lg shadow-xl flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center justify-between sm:rounded-t-lg">
          <h2 className="text-lg font-bold truncate pr-4">Карточка кандидата</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none p-1">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="py-8 text-center text-gray-500">Загрузка...</div>}

          {!loading && candidate && (
            <CandidateForm
              candidate={candidate}
              statuses={statuses}
              onSubmit={handleSubmit}
            />
          )}

          {!loading && !candidate && <div className="py-8 text-center text-red-500">Кандидат не найден</div>}
        </div>
      </div>
    </div>
  )
}
