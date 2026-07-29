import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not auth' }, { status: 401 })

  const admin = supabase
  const { count, error } = await admin.from('candidates').select('id', { count: 'exact' })

  // Batch count
  let total = 0
  let page = 0
  const PAGE_SIZE = 1000
  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await admin.from('candidates').select('id').order('created_at', { ascending: false }).range(from, to)
    if (!data || data.length === 0) break
    total += data.length
    if (data.length < PAGE_SIZE) break
    page++
  }

  return NextResponse.json({ count, batch_total: total, user_id: user.id })
}
