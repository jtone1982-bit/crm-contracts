import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: module, error: moduleError } = await supabase
    .from('training_modules')
    .select('id, slug, title, description, passing_score, is_final, content')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (moduleError || !module) {
    return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
  }

  // Check theory viewed progress (except final)
  let theoryViewed = false
  if (!module.is_final) {
    const { data: theoryProgress } = await supabase
      .from('training_theory_progress')
      .select('viewed')
      .eq('user_id', user.id)
      .eq('module_id', module.id)
      .single()
    theoryViewed = theoryProgress?.viewed || false
  }
  const { data: questions, error: questionsError } = await supabase
    .from('training_questions')
    .select('id, question_text, options, explanation')
    .eq('module_id', module.id)
    .eq('active', true)

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  // Shuffle questions and options
  const shuffledQuestions = [...(questions || [])].sort(() => Math.random() - 0.5)
  const prepared = shuffledQuestions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    options: [...(q.options || [])].sort(() => Math.random() - 0.5),
    explanation: q.explanation,
  }))

  return NextResponse.json(
    {
      module,
      questions: prepared,
      total: prepared.length,
      theory_viewed: theoryViewed,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  )
}
