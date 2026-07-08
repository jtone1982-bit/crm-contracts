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

export const DISEASES = ['ВИЧ', 'Гепатит А', 'Гепатит Б', 'Гепатит С', 'Отсутствует']
export const HEALTH_GROUPS = ['А', 'Б', 'В', 'Г', 'Д']
export const DOCUMENTS = [
  'Паспорт',
  'ИНН',
  'СНИЛС',
  'Военный билет',
  'Диплом об образовании',
  'Повышение квалификации',
]
export const CRIMINAL_RECORDS = ['Да (не погашена)', 'Да (погашена)', 'Нет']
export const DRIVER_LICENSES = ['B', 'B,C', 'B,C,E и выше']
export const FAMILY_RELATIONS = ['Да', 'Нет, распределение']
export const CITIZEN_OPTIONS = ['Да', 'Нет']
export const YES_NO = ['Да', 'Нет']

export const FAILURE_REASONS = [
  'Недозвон 1',
  'Недозвон 2',
  'Недозвон 3',
  'Отправлено сообщение',
  'Автоответчик',
  'Неактуально',
  'Работает с другими',
  'Уже на СВО',
  'Другое',
  'Женщина',
  'Комиссован',
  'Чёрный список',
]

export const FAILURE_TO_STATUS: Record<string, PipelineStatus> = {
  Женщина: 'Женщины, офицеры, комисс',
  Комиссован: 'Женщины, офицеры, комисс',
  Офицер: 'Женщины, офицеры, комисс',
  'Чёрный список': 'Черный список',
  Неактуально: 'Неактуально',
}

export interface CandidateFile {
  id: string
  candidate_id: string
  file_type: string
  file_url: string
  file_name: string
  created_at: string
}

export interface Candidate {
  id: string
  phone: string
  full_name?: string | null
  birth_date?: string | null
  age?: string | null
  citizen_rf?: string | null
  city_from?: string | null
  city_to?: string | null
  lead_source?: string | null
  health_group?: string | null
  health_group_reason?: string | null
  diseases?: string[] | null
  scars?: string | null
  other_health_issues?: string | null
  criminal_record?: string | null
  criminal_article?: string | null
  documents?: string[] | null
  foreign_documents?: string | null
  driver_license?: string | null
  family_relation?: string | null
  is_officer?: boolean | null
  is_woman?: boolean | null
  is_commissioned?: boolean | null
  status: PipelineStatus
  notes?: string | null
  departure_date?: string | null
  departure_datetime?: string | null
  next_contact_date?: string | null
  reason_for_failure?: string | null
  failure_comment?: string | null
  comments?: string | null
  telegram_username?: string | null
  whatsapp_number?: string | null
  max_contact?: string | null
  manager_id?: string | null
  bitrix_deal_id?: string | null
  created_at?: string
  last_activity_at?: string | null
  last_manager_login_at?: string | null
  department_id?: string | null
  candidate_files?: CandidateFile[]
  manager?: { full_name?: string | null }
}
