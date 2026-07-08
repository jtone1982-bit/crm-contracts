export const PIPELINE_STATUSES = [
  'На обзвон',
  'Недозвон',
  'В работе',
  'На билетах',
  'На оформлении',
  'Подписал',
  'Женщины, офицеры, комисс',
  'Неактуально',
  'Архив',
  'Черный список',
]

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

export interface Candidate {
  id: string
  created_at: string
  phone: string
  full_name?: string
  birth_date?: string
  city_from?: string
  city_to?: string
  lead_source?: string
  health_group?: string
  diseases?: string
  scars?: string
  documents?: string
  is_officer?: boolean
  is_woman?: boolean
  is_commissioned?: boolean
  status: PipelineStatus
  notes?: string
  departure_date?: string
  next_contact_date?: string
  manager_id: string
  manager_email?: string
  imported_from_sheets?: boolean
  sheet_row_index?: number
}
