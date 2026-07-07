import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const update = await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', user.id)

  if (update.error?.message?.includes('last_active_at')) {
    return NextResponse.json({ success: true, skipped: true })
  }

  if (update.error) {
    console.error('[heartbeat] error', update.error.message)
    return NextResponse.json({ error: 'Не удалось обновить активность' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
