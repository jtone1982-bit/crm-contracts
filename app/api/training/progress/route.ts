import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, slug, title, passing_score, order_index, is_final')
    .eq('active', true)
    .order('order_index', { ascending: true })

  const { data: progress } = await supabase
    .from('training_progress')
    .select('module_id, status, best_score, attempts_count, completed_at')
    .eq('user_id', user.id)

  const progressMap = new Map(progress?.map(p => [p.module_id, p]) || [])

  const totalModules = modules?.length || 0
  const completedModules = modules?.filter(m => progressMap.get(m.id)?.status === 'completed').length || 0
  const finalPassed = modules?.find(m => m.is_final && progressMap.get(m.id)?.status === 'completed') !== undefined

  return NextResponse.json({
    total_modules: totalModules,
    completed_modules: completedModules,
    completion_rate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
    final_exam_passed: finalPassed,
    progress: progress,
  })
}
