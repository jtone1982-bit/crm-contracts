import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const departmentId = searchParams.get('department_id')
  const managerId = searchParams.get('manager_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('candidates')
    .select('id, phone, full_name, status, city_to, departure_datetime, manager:profiles(full_name)')
    .not('departure_datetime', 'is', null)

  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  if (managerId) {
    query = query.eq('manager_id', managerId)
  }

  if (from && to) {
    query = query.gte('departure_datetime', from).lte('departure_datetime', to)
  }

  const { data, error } = await query.order('departure_datetime', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
