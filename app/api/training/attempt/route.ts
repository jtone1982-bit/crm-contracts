import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const body = await request.json()
  const { module_id, answers } = body

  if (!module_id || !answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
  }

  // Get module info
  const { data: module, error: moduleError } = await supabase
    .from('training_modules')
    .select('id, slug, title, passing_score, is_final')
    .eq('id', module_id)
    .single()

  if (moduleError || !module) {
    return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
  }

  const questionIds = Object.keys(answers)
  const { data: questions } = await supabase
    .from('training_questions')
    .select('id, correct_answer, question_type')
    .in('id', questionIds)
    .eq('module_id', module_id)

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Вопросы не найдены' }, { status: 404 })
  }

  let correct = 0
  const checkedAnswers: Record<string, { user_answer: string | string[]; correct_answer: any; is_correct: boolean }> = {}

  function normalize(a: string) {
    return a.trim().toLowerCase()
  }

  function arraysEqual(a: string[], b: any[]) {
    const aa = a.map(normalize).sort()
    const bb = (b || []).map((x: string) => normalize(x)).sort()
    return aa.length === bb.length && aa.every((val, idx) => val === bb[idx])
  }

  for (const q of questions) {
    const userAnswer = answers[q.id] || (q.question_type === 'multiple_choice' ? [] : '')
    let isCorrect = false

    if (q.question_type === 'multiple_choice') {
      const selected = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      isCorrect = arraysEqual(selected, q.correct_answer)
    } else {
      const ca = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer
      isCorrect = normalize(userAnswer) === normalize(ca)
    }

    if (isCorrect) correct++
    checkedAnswers[q.id] = {
      user_answer: userAnswer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
    }
  }

  const total = questions.length
  const score = Math.round((correct / total) * 100)
  const passed = score >= module.passing_score

  // Save attempt
  await supabase.from('training_attempts').insert({
    user_id: user.id,
    module_id,
    score,
    passing_score: module.passing_score,
    passed,
    answers: checkedAnswers,
    is_final: module.is_final,
  })

  // Update progress
  const { data: existingProgress } = await supabase
    .from('training_progress')
    .select('best_score, attempts_count, completed_at')
    .eq('user_id', user.id)
    .eq('module_id', module_id)
    .single()

  const progressUpdate: any = {
    user_id: user.id,
    module_id,
    status: passed ? 'completed' : 'in_progress',
    best_score: Math.max(existingProgress?.best_score || 0, score),
    attempts_count: (existingProgress?.attempts_count || 0) + 1,
    last_attempt_at: new Date().toISOString(),
  }

  if (passed && !existingProgress?.completed_at) {
    progressUpdate.completed_at = new Date().toISOString()
  }

  if (existingProgress) {
    await supabase
      .from('training_progress')
      .update(progressUpdate)
      .eq('user_id', user.id)
      .eq('module_id', module_id)
  } else {
    await supabase.from('training_progress').insert(progressUpdate)
  }

  return NextResponse.json({
    score,
    total,
    correct,
    passed,
    passing_score: module.passing_score,
    is_final: module.is_final,
    answers: checkedAnswers,
  })
}
