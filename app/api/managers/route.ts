import { NextResponse } from 'next/server'
import { requireManagerOrAdmin } from '@/lib/guards'

export async function GET() {
  const { supabase, user, profile } = await requireManagerOrAdmin()
  const isAdmin = profile.role === 'admin'

  let query = supabase.from('profiles').select('id, full_name, role').in('role', ['manager', 'admin'])
  if (!isAdmin) {
    query = query.eq('id', user.id)
  }

  const { data, error } = await query.order('full_name', { ascending: true })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ managers: data || [] })
}
