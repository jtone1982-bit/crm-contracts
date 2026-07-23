import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const departmentId = searchParams.get('department_id')
  const managerId = searchParams.get('manager_id')
  const q = searchParams.get('q')?.trim() || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase.from('candidates').select('*, manager:profiles(full_name)')

  if (profile.role === 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  if (managerId) {
    query = query.eq('manager_id', managerId)
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
