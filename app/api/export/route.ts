import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  let query = supabase.from('candidates').select('*')
  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  const { data: candidates, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = candidates.map((c) => ({
    Телефон: c.phone,
    ФИО: c.full_name || '',
    'Дата рождения': c.birth_date || '',
    'Откуда': c.city_from || '',
    'Куда': c.city_to || '',
    'Источник': c.lead_source || '',
    'Группа здоровья': c.health_group || '',
    Болезни: c.diseases || '',
    Шрамы: c.scars || '',
    Документы: c.documents || '',
    Офицер: c.is_officer ? 'да' : 'нет',
    Женщина: c.is_woman ? 'да' : 'нет',
    Комиссованный: c.is_commissioned ? 'да' : 'нет',
    Статус: c.status,
    Комментарий: c.notes || '',
    'Дата выезда': c.departure_date || '',
    'Следующий контакт': c.next_contact_date || '',
    'Дата создания': c.created_at,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Кандидаты')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="candidates.xlsx"',
    },
  })
}
