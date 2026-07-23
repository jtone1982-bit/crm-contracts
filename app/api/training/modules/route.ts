import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: modules, error } = await supabase
    .from('training_modules')
    .select('id, slug, title, description, passing_score, order_index, is_final, active')
    .eq('active', true)
    .order('order_index', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: progress } = await supabase
    .from('training_progress')
    .select('module_id, status, best_score, attempts_count, completed_at')
    .eq('user_id', user.id)

  const progressMap = new Map(progress?.map(p => [p.module_id, p]) || [])

  const result = modules?.map(m => ({
    ...m,
    progress: progressMap.get(m.id) || null,
  }))

  return NextResponse.json({ modules: result })
}
