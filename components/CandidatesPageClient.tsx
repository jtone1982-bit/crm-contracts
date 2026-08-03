'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ViewSwitcher from '@/components/ViewSwitcher'
import CandidatesList from '@/components/CandidatesList'
import KanbanBoard from '@/components/KanbanBoard'

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
  status?: string | null
  manager_id?: string | null
  manager?: { full_name: string | null } | { full_name: string | null }[] | null
}

interface Manager {
  id: string
  full_name: string | null
  role: string
}

interface CandidatesPageClientProps {
  candidates: Candidate[]
  statusFilter?: string
  isAdmin?: boolean
  leadSources?: string[]
  activeSource?: string
  managers?: Manager[]
  activeManagerId?: string
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export default function CandidatesPageClient({
  candidates,
  statusFilter,
  isAdmin,
  leadSources,
  activeSource,
  managers,
  activeManagerId,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: CandidatesPageClientProps) {
  const [currentView, setCurrentView] = useState<'list' | 'kanban' | 'split'>('list')
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/candidates?${params.toString()}`)
  }

  const setPageSize = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    params.set('page_size', size.toString())
    router.push(`/candidates?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#f7f8f8' }}>
          {statusFilter ? statusFilter : 'Все кандидаты'}
        </h1>
        <ViewSwitcher currentView={currentView} onChange={setCurrentView} />
      </div>

      {currentView === 'list' && (
        <CandidatesList
          candidates={candidates}
          statusFilter={statusFilter}
          isAdmin={isAdmin}
          leadSources={leadSources}
          activeSource={activeSource}
          managers={managers}
          activeManagerId={activeManagerId}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {currentView === 'kanban' && (
        <KanbanBoard candidates={candidates} statuses={[]} />
      )}

      {currentView === 'split' && (
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          <div className="w-1/3 overflow-y-auto pr-2">
            <CandidatesList
              candidates={candidates}
              statusFilter={statusFilter}
              isAdmin={isAdmin}
              leadSources={leadSources}
              activeSource={activeSource}
              managers={managers}
              activeManagerId={activeManagerId}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
            />
          </div>
          <div className="w-2/3 rounded-xl p-4 flex items-center justify-center"
            style={{ background: '#0f1011', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p style={{ color: '#5c6168' }}>Выберите кандидата из списка слева</p>
          </div>
        </div>
      )}
    </div>
  )
}
