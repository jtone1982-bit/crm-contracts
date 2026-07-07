import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function normalizePhone(raw: any): string {
  if (!raw) return ''
  const s = String(raw).replace(/\D/g, '')
  if (s.startsWith('8') && s.length === 11) return '+7' + s.slice(1)
  if (s.startsWith('9') && s.length === 10) return '+7' + s
  if (s.startsWith('7') && s.length === 11) return '+' + s
  if (s) return '+' + s
  return ''
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    // Chence sends phone in msisdn or phone field
    const phoneRaw = payload.msisdn || payload.phone || payload.telephone || payload.Телефон
    const phone = normalizePhone(phoneRaw)
    if (!phone) {
      return NextResponse.json({ error: 'No phone', imported: 0 }, { status: 400 })
    }

    // Project name
    let project = ''
    if (typeof payload.project === 'object' && payload.project?.name) {
      project = payload.project.name
    } else if (typeof payload.project === 'string') {
      project = payload.project
    }

    // Get active managers
    const { data: managers, error: managersError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id')
      .eq('role', 'manager')
      .eq('approved', true)
      .eq('active', true)

    if (managersError || !managers || managers.length === 0) {
      return NextResponse.json({ error: 'No active managers', imported: 0 }, { status: 400 })
    }

    // Check duplicate
    const { data: existing } = await getSupabaseAdmin()
      .from('candidates')
      .select('id')
      .eq('phone', phone)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ imported: 0, duplicate: true, phone })
    }

    // Round-robin: pick manager with fewest candidates
    const { data: counts } = await getSupabaseAdmin()
      .from('candidates')
      .select('manager_id, count', { count: 'exact' })
      .in('manager_id', managers.map((m) => m.id))

    const countMap = new Map<string, number>()
    managers.forEach((m) => countMap.set(m.id, 0))
    counts?.forEach((c: any) => {
      countMap.set(c.manager_id, Number(c.count || 0))
    })

    let minId = managers[0].id
    let minCount = Infinity
    managers.forEach((m) => {
      const c = countMap.get(m.id) || 0
      if (c < minCount) {
        minCount = c
        minId = m.id
      }
    })

    const { error: insertError } = await getSupabaseAdmin().from('candidates').insert({
      phone,
      manager_id: minId,
      status: 'На обзвон',
      city_to: project,
      source: 'chence-webhook',
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message, imported: 0 }, { status: 500 })
    }

    return NextResponse.json({ imported: 1, phone, manager_id: minId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook failed', imported: 0 }, { status: 500 })
  }
}
