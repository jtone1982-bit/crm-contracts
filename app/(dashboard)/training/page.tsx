'use client'

import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle, Lock, ChevronRight, AlertCircle, Trophy, FileText } from 'lucide-react'

interface TheoryItem {
  type: string
  title?: string
  step?: string
  description?: string
  subtitle?: string
  requirements?: string
  age?: string
  note?: string
  edv?: string
  zp?: string
  vvk?: string
  status?: string
  num?: string
}

interface Module {
  id: string
  slug: string
  title: string
  description: string | null
  passing_score: number
  order_index: number
  is_final: boolean
  content: TheoryItem[]
  progress: {
    status: string
    best_score: number
    attempts_count: number
    completed_at: string | null
  } | null
}

interface Question {
  id: string
  question_text: string
  options: string[]
  explanation: string | null
}

export default function TrainingPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [theoryViewed, setTheoryViewed] = useState(false)
  const [showTest, setShowTest] = useState(false)

  useEffect(() => {
    fetchModules()
  }, [])

  async function fetchModules() {
    try {
      const res = await fetch('/api/training/modules')
      const data = await res.json()
      if (data.modules) {
        setModules(data.modules)
      }
    } catch (e) {
      setError('Не удалось загрузить модули')
    } finally {
      setLoading(false)
    }
  }

  async function startModule(mod: Module) {
    if (mod.is_final) {
      const regular = modules.filter((m) => !m.is_final)
      const completed = regular.filter((m) => m.progress?.status === 'completed').length
      if (completed < regular.length) {
        setError('Финальный экзамен доступен только после прохождения всех разделов')
        return
      }
    }

    setSelectedModule(mod)
    setResult(null)
    setAnswers({})
    setError(null)
    setTestLoading(true)
    setShowTest(false)

    try {
      const res = await fetch(`/api/training/modules/${mod.slug}`)
      const data = await res.json()
      if (data.questions) {
        // Shuffle once more on client to avoid any predictable order
        const shuffled = [...data.questions].sort(() => Math.random() - 0.5)
        shuffled.forEach((q) => {
          q.options = [...q.options].sort(() => Math.random() - 0.5)
        })
        setQuestions(shuffled)
        // Always start with theory view; do not auto-skip based on prior progress
        setTheoryViewed(false)
        setShowTest(false)
      } else {
        setError(data.error || 'Вопросы не загрузились')
      }
    } catch (e) {
      setError('Ошибка загрузки вопросов')
    } finally {
      setTestLoading(false)
    }
  }

  async function markTheoryViewed() {
    if (!selectedModule) return
    await fetch('/api/training/theory-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: selectedModule.id }),
    })
    setTheoryViewed(true)
    setShowTest(true)
  }

  async function submitTest() {
    if (!selectedModule) return
    const answeredCount = Object.keys(answers).length
    if (answeredCount < questions.length) {
      setError(`Ответьте на все вопросы. Осталось ${questions.length - answeredCount}`)
      return
    }

    setTestLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/training/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: selectedModule.id, answers }),
      })
      const data = await res.json()
      setResult(data)
      if (data.passed) {
        fetchModules()
      }
    } catch (e) {
      setError('Ошибка отправки ответов')
    } finally {
      setTestLoading(false)
    }
  }

  function resetToModules() {
    setSelectedModule(null)
    setResult(null)
    setAnswers({})
    setError(null)
    setShowTest(false)
    setTheoryViewed(false)
  }

  function getModuleStatus(mod: Module) {
    if (!mod.progress) return 'not_started'
    return mod.progress.status
  }

  function getProgressColor(status: string) {
    if (status === 'completed') return 'bg-green-700'
    if (status === 'in_progress') return 'bg-[#c2410c]'
    return 'bg-[#d6cfc3]'
  }

  function renderTheoryItem(item: TheoryItem, idx: number) {
    switch (item.type) {
      case 'step':
        return (
          <div key={idx} className="flex gap-4 p-4 rounded-xl bg-[#fff7ed] border border-[#f0d9c9]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c2410c] text-white flex items-center justify-center font-bold text-sm">
              {item.step}
            </div>
            <div>
              <p className="font-medium text-[#2d2520]">{item.title}</p>
              {item.description && <p className="text-sm text-[#5c4d3d] mt-1">{item.description}</p>}
            </div>
          </div>
        )
      case 'section':
        return (
          <h3 key={idx} className="text-lg font-bold text-[#2d2520] mt-6 mb-3 pb-2 border-b border-[#e5ddd2]">
            {item.title}
          </h3>
        )
      case 'card':
        return (
          <div key={idx} className="p-4 rounded-xl bg-white border border-[#e5ddd2]">
            <p className="font-medium text-[#2d2520]">{item.title}</p>
            {item.subtitle && <p className="text-xs text-[#c2410c] mt-1">{item.subtitle}</p>}
            {item.description && <p className="text-sm text-[#5c4d3d] mt-2">{item.description}</p>}
          </div>
        )
      case 'rule':
        return (
          <div key={idx} className="p-4 rounded-xl bg-white border border-[#e5ddd2]">
            {item.title && <p className="font-medium text-[#2d2520] mb-1">{item.title}</p>}
            <p className="text-sm text-[#5c4d3d]">{item.description}</p>
          </div>
        )
      case 'program':
        return (
          <div key={idx} className="p-4 rounded-xl bg-white border border-[#e5ddd2]">
            <p className="font-medium text-[#2d2520]">{item.title}</p>
            {item.description && <p className="text-sm text-[#5c4d3d] mt-1">{item.description}</p>}
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {item.requirements && <span className="px-2 py-1 rounded bg-[#fff7ed] text-[#c2410c]">Требования: {item.requirements}</span>}
              {item.age && <span className="px-2 py-1 rounded bg-[#f0f9ff] text-[#0369a1]">Возраст: {item.age}</span>}
            </div>
          </div>
        )
      case 'direction':
      case 'selection':
        return (
          <div key={idx} className="p-4 rounded-xl bg-white border border-[#e5ddd2]">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-[#2d2520]">{item.title}</p>
              {item.status && item.status.toLowerCase() === 'стоп' && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Стоп</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#5c4d3d]">
              {item.edv && <span>ЕДВ: {item.edv}</span>}
              {item.zp && <span>ЗП: {item.zp}</span>}
              {item.age && <span>Возраст: {item.age}</span>}
              {item.vvk && <span>ВВК: {item.vvk}</span>}
            </div>
          </div>
        )
      case 'rank':
        return (
          <div key={idx} className="p-3 rounded-xl bg-white border border-[#e5ddd2]">
            <p className="font-medium text-[#2d2520]">{item.title}</p>
            {item.subtitle && <p className="text-xs text-[#5c4d3d]">{item.subtitle}</p>}
            {item.description && <p className="text-sm text-[#5c4d3d] mt-1">{item.description}</p>}
          </div>
        )
      case 'point':
      case 'tip':
        return (
          <div key={idx} className="p-4 rounded-xl bg-white border border-[#e5ddd2]">
            <div className="flex items-start gap-3 mb-3">
              {item.num && (
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f0ebe3] text-[#5c4d3d] flex items-center justify-center text-xs font-bold">
                  {item.num}
                </span>
              )}
              {item.title && (
                <p className="text-sm font-semibold text-[#2d2520] pt-1.5">{item.title}</p>
              )}
            </div>
            <p className="text-sm text-[#5c4d3d] leading-relaxed">{item.description}</p>
          </div>
        )
      default:
        return (
          <div key={idx} className="p-4 rounded-xl bg-white border border-[#e5ddd2]">
            {item.title && <p className="font-semibold text-[#2d2520] mb-2">{item.title}</p>}
            {item.description && <p className="text-sm text-[#5c4d3d] leading-relaxed">{item.description}</p>}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8" style={{ background: '#f5f1ea', minHeight: '100vh' }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#2d2520' }}>Обучение</h1>
          <p style={{ color: '#5c4d3d' }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (selectedModule) {
    return (
      <div className="p-4 md:p-8" style={{ background: '#f5f1ea', minHeight: '100vh' }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={resetToModules}
            className="mb-4 text-sm hover:underline"
            style={{ color: '#c2410c' }}
          >
            ← Назад к модулям
          </button>

          <div className="bg-[#fefdfb] rounded-2xl p-6 mb-4 shadow-sm" style={{ border: '1px solid rgba(60,50,40,0.08)' }}>
            <div className="flex items-center gap-3 mb-2">
              {selectedModule.is_final && <Trophy size={24} className="text-[#c2410c]" />}
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#2d2520' }}>{selectedModule.title}</h1>
            </div>
            <p className="text-sm" style={{ color: '#5c4d3d' }}>Проходной балл: {selectedModule.passing_score}%</p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {result ? (
            <div className="bg-[#fefdfb] rounded-2xl p-6 shadow-sm" style={{ border: '1px solid rgba(60,50,40,0.08)' }}>
              <div
                className={`text-center p-6 rounded-xl mb-6 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div className={`text-4xl font-bold mb-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                  {result.score}%
                </div>
                <p className={`text-lg font-medium ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                  {result.passed ? 'Раздел пройден' : 'Не пройден'}
                </p>
                <p className="text-sm mt-2" style={{ color: '#5c4d3d' }}>
                  Правильно {result.correct} из {result.total}
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const ans = result.answers[q.id]
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border ${ans?.is_correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}
                    >
                      <p className="font-medium text-sm mb-2" style={{ color: '#2d2520' }}>
                        {idx + 1}. {q.question_text}
                      </p>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-gray-500">Ваш ответ:</span> {ans?.user_answer || '—'}
                        </p>
                        {!ans?.is_correct && (
                          <p>
                            <span className="text-green-600">Правильный ответ:</span> {ans?.correct_answer}
                          </p>
                        )}
                        {q.explanation && <p className="text-xs mt-2 text-gray-600">{q.explanation}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex gap-3">
                {!result.passed && (
                  <button
                    onClick={() => { setResult(null); setAnswers({}); setError(null); setShowTest(false); setTheoryViewed(false) }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ background: '#c2410c' }}
                  >
                    Пересдать
                  </button>
                )}
                <button
                  onClick={resetToModules}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#f0ebe3', color: '#2d2520' }}
                >
                  К модулям
                </button>
              </div>
            </div>
          ) : showTest ? (
            <div className="space-y-4">
              {testLoading ? (
                <div className="text-center py-12" style={{ color: '#5c4d3d' }}>Загрузка вопросов...</div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-[#fefdfb] rounded-2xl p-5 shadow-sm"
                      style={{ border: '1px solid rgba(60,50,40,0.08)' }}
                    >
                      <p className="font-medium mb-4" style={{ color: '#2d2520' }}>
                        {idx + 1}. {q.question_text}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const checked = answers[q.id] === opt
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                                checked
                                  ? 'border-[#c2410c] bg-[#c2410c]/5'
                                  : 'border-transparent hover:bg-black/[0.02]'
                              }`}
                              style={{
                                background: checked ? undefined : 'rgba(240,235,227,0.4)',
                              }}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={checked}
                                onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                className="accent-[#c2410c]"
                              />
                              <span className="text-sm" style={{ color: '#2d2520' }}>{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={submitTest}
                    disabled={testLoading}
                    className="w-full md:w-auto px-8 py-3 rounded-xl text-sm font-medium text-white shadow-sm hover:shadow-md transition"
                    style={{ background: '#c2410c' }}
                  >
                    {testLoading ? 'Проверка...' : 'Завершить тест'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#fff7ed] rounded-xl p-4 border border-[#f0d9c9] flex items-start gap-3">
                <FileText size={20} className="text-[#c2410c] mt-0.5" />
                <div>
                  <p className="font-medium text-[#2d2520]">Изучите материал раздела</p>
                  <p className="text-sm text-[#5c4d3d]">После просмотра теории откроется тест.</p>
                </div>
              </div>

              <div className="space-y-3">
                {(selectedModule.content || []).map((item, idx) => renderTheoryItem(item, idx))}
              </div>

              <button
                onClick={markTheoryViewed}
                className="w-full md:w-auto px-8 py-3 rounded-xl text-sm font-medium text-white shadow-sm hover:shadow-md transition"
                style={{ background: '#c2410c' }}
              >
                Я изучил(а) материал — перейти к тесту
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const regular = modules.filter((m) => !m.is_final)
  const completedCount = regular.filter((m) => m.progress?.status === 'completed').length
  const allCompleted = completedCount === regular.length && regular.length > 0

  return (
    <div className="p-4 md:p-8" style={{ background: '#f5f1ea', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#2d2520' }}>Обучение</h1>
          <p className="text-sm" style={{ color: '#5c4d3d' }}>
            Изучи теорию по каждому разделу, затем пройди тест. Вопросы синхронизируются с памяткой.
          </p>
        </div>

        <div className="bg-[#fefdfb] rounded-2xl p-5 mb-6 shadow-sm" style={{ border: '1px solid rgba(60,50,40,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: '#2d2520' }}>Общий прогресс</span>
            <span className="text-sm font-bold" style={{ color: '#c2410c' }}>{completedCount} / {regular.length} разделов</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f0ebe3' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${regular.length > 0 ? (completedCount / regular.length) * 100 : 0}%`,
                background: allCompleted ? '#15803d' : '#c2410c',
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => {
            const status = getModuleStatus(mod)
            const isLocked = mod.is_final && !allCompleted
            return (
              <div
                key={mod.id}
                onClick={() => !isLocked && startModule(mod)}
                className={`bg-[#fefdfb] rounded-2xl p-5 shadow-sm transition ${
                  isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                }`}
                style={{ border: '1px solid rgba(60,50,40,0.08)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: status === 'completed' ? '#dcfce7' : '#fff7ed' }}
                    >
                      {status === 'completed' ? (
                        <CheckCircle size={20} className="text-green-700" />
                      ) : isLocked ? (
                        <Lock size={20} className="text-[#a89a8c]" />
                      ) : (
                        <BookOpen size={20} className="text-[#c2410c]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#2d2520' }}>{mod.title}</h3>
                      {mod.is_final && <span className="text-xs text-[#c2410c] font-medium">Финальный экзамен</span>}
                    </div>
                  </div>
                  {!isLocked && <ChevronRight size={20} className="text-[#a89a8c]" />}
                </div>

                {mod.description && <p className="text-sm mb-3" style={{ color: '#5c4d3d' }}>{mod.description}</p>}

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#a89a8c' }}>Проходной: {mod.passing_score}%</span>
                  {mod.progress && (
                    <span className={`text-xs font-medium ${status === 'completed' ? 'text-green-700' : 'text-[#c2410c]'}`}>
                      {status === 'completed'
                        ? `Пройден — ${mod.progress.best_score}%`
                        : `Лучший результат — ${mod.progress.best_score}%`}
                    </span>
                  )}
                </div>

                {mod.progress && (
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: '#f0ebe3' }}>
                    <div
                      className={`h-full rounded-full ${getProgressColor(status)}`}
                      style={{ width: `${Math.min(mod.progress.best_score, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
