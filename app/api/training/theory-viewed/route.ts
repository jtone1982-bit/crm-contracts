import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { module_id } = await request.json()

  if (!module_id) {
    return NextResponse.json({ error: 'module_id обязателен' }, { status: 400 })
  }

  await supabase.from('training_theory_progress').upsert({
    user_id: user.id,
    module_id,
    viewed: true,
    viewed_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
