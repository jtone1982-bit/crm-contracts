import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
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

  if (!q) {
    return NextResponse.json([])
  }

  const { data: managers, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', `%${q}%`)
    .eq('role', 'manager')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(managers || [])
}
