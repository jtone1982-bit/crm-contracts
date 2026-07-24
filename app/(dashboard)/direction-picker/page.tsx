'use client'

import { isForbiddenArticle } from '@/lib/forbidden-articles'
import { useEffect, useState } from 'react'

interface CityResult {
  title: string
  program?: string
  edv?: string
  zp?: string
  age?: string
  foreign?: string
  diseases?: string
  health_group?: string
  drivers?: string
  bpla?: string
  programs?: string
  relations?: string
  status?: string
  note?: string
  matches: string[]
  mismatches: string[]
  score: number
}

export default function DirectionPickerPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [age, setAge] = useState('')
  const [citizenship, setCitizenship] = useState('')
  const [disease, setDisease] = useState('')
  const [drivers, setDrivers] = useState(false)
  const [bpla, setBpla] = useState(false)
  const [relations, setRelations] = useState('')
  const [edvMin, setEdvMin] = useState('')
  const [edvMax, setEdvMax] = useState('')
  const [praetorian, setPraetorian] = useState('')
  const [conviction, setConviction] = useState('')
  const [convictionArticle, setConvictionArticle] = useState('')
  const [commissioned, setCommissioned] = useState('')
  const [healthGroup, setHealthGroup] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CityResult[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/direction-picker', { method: 'POST', body: '{}' })
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          setAllowed(false)
        } else {
          setAllowed(true)
        }
      })
      .catch(() => setAllowed(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/direction-picker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age,
          citizenship,
          disease,
          drivers,
          bpla,
          relations,
          edvMin,
          edvMax,
          praetorian,
          conviction,
          convictionArticle,
          commissioned,
          healthGroup,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setResults(data.results || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (allowed === null) {
    return <div className="p-6">Загрузка...</div>
  }

  if (!allowed) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          У вас нет доступа к этому инструменту.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto" style={{ color: '#2d2520' }}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Подбор направления</h1>
      <p className="text-sm mb-6" style={{ color: '#5c4d3d' }}>
        Введите параметры кандидата и получите список подходящих направлений.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-[#fefdfb] rounded-2xl p-5 shadow-sm mb-6"
        style={{ border: '1px solid rgba(60,50,40,0.08)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Возраст</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
              placeholder="Например, 35"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Гражданство</label>
            <select
              value={citizenship}
              onChange={(e) => setCitizenship(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
            >
              <option value="">Не выбрано</option>
              <option value="РФ">РФ</option>
              <option value="СНГ">СНГ</option>
              <option value="Иностранец">Иностранец</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Особенность здоровья / болезнь</label>
            <input
              type="text"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
              placeholder="Например, гепатит, ВИЧ, псориаз"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Отношения</label>
            <select
              value={relations}
              onChange={(e) => setRelations(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
            >
              <option value="">Не важно</option>
              <option value="да">Нужны отношения (да)</option>
              <option value="нет">Без отношений (нет)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">ЕДВ от</label>
              <input
                type="number"
                value={edvMin}
                onChange={(e) => setEdvMin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: '#e5ddd2', background: '#fff' }}
                placeholder="Мин"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">ЕДВ до</label>
              <input
                type="number"
                value={edvMax}
                onChange={(e) => setEdvMax(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: '#e5ddd2', background: '#fff' }}
                placeholder="Макс"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="drivers"
              type="checkbox"
              checked={drivers}
              onChange={(e) => setDrivers(e.target.checked)}
              className="accent-[#c2410c]"
            />
            <label htmlFor="drivers" className="text-sm">Водительские права</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="bpla"
              type="checkbox"
              checked={bpla && !conviction.startsWith('yes') && healthGroup === 'А'}
              disabled={conviction.startsWith('yes') || healthGroup !== 'А'}
              onChange={(e) => {
                if (!conviction.startsWith('yes') && healthGroup === 'А') {
                  setBpla(e.target.checked)
                }
              }}
              className="accent-[#c2410c] disabled:opacity-50"
            />
            <label
              htmlFor="bpla"
              className={
                conviction.startsWith('yes') || healthGroup !== 'А'
                  ? 'text-sm text-red-600'
                  : 'text-sm'
              }
            >
              Оператор БПЛА
              {conviction.startsWith('yes') && ' (недоступно при судимости)'}
              {!conviction.startsWith('yes') && healthGroup && healthGroup !== 'А' && ' (только группа А)'}
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Группа здоровья</label>
            <select
              value={healthGroup}
              onChange={(e) => {
                setHealthGroup(e.target.value)
                if (e.target.value !== 'А') setBpla(false)
              }}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
            >
              <option value="">Не выбрано</option>
              <option value="А">А</option>
              <option value="Б">Б</option>
              <option value="В">В</option>
              <option value="Г">Г</option>
              <option value="Д">Д</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Прапорщик</label>
            <select
              value={praetorian}
              onChange={(e) => setPraetorian(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
            >
              <option value="">Не выбрано</option>
              <option value="да">Да</option>
              <option value="нет">Нет</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Судимость</label>
            <select
              value={conviction}
              onChange={(e) => {
                setConviction(e.target.value)
                if (e.target.value.startsWith('yes')) setBpla(false)
              }}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
            >
              <option value="">Не выбрано</option>
              <option value="yes_cleared">Да (погашена)</option>
              <option value="yes_active">Да (непогашена)</option>
              <option value="нет">Нет</option>
            </select>
          </div>
          <div className={conviction.startsWith('yes') ? 'block' : 'hidden'}>
            <label className="block text-sm font-medium mb-1">
              Статья судимости
              {convictionArticle && isForbiddenArticle(convictionArticle).forbidden && (
                <span className="text-red-600 font-normal ml-2">
                  Запрещена: {isForbiddenArticle(convictionArticle).matched.join(', ')}
                </span>
              )}
            </label>
            <input
              type="text"
              value={convictionArticle}
              onChange={(e) => setConvictionArticle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
              placeholder="Например, 105, 111, 228"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Комиссован</label>
            <select
              value={commissioned}
              onChange={(e) => setCommissioned(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#e5ddd2', background: '#fff' }}
            >
              <option value="">Не выбрано</option>
              <option value="да">Да</option>
              <option value="нет">Нет</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm"
          style={{ background: '#c2410c' }}
        >
          {loading ? 'Подбираю...' : 'Подобрать направления'}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Рекомендуемые направления</h2>
          {results.map((city) => (
            <div
              key={city.title}
              className="bg-[#fefdfb] rounded-2xl p-5 shadow-sm"
              style={{ border: '1px solid rgba(60,50,40,0.08)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{city.title}</h3>
                {city.status?.toLowerCase() === 'активно' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Активно</span>
                )}
              </div>

              {city.program && (
                <p className="text-xs text-[#c2410c] mb-2">{city.program}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {city.edv && <span className="px-2 py-1 rounded bg-[#fff7ed] text-[#c2410c]">ЕДВ: {city.edv}</span>}
                {city.zp && <span className="px-2 py-1 rounded bg-[#f0f9ff] text-[#0369a1]">ЗП: {city.zp}</span>}
                {city.age && <span className="px-2 py-1 rounded bg-[#f0f0f0]">Возраст: {city.age}</span>}
                {city.diseases && <span className="px-2 py-1 rounded bg-[#fff7ed] text-[#c2410c]">Болезни: {city.diseases}</span>}
                {city.foreign && <span className="px-2 py-1 rounded bg-[#f0f0f0]">{city.foreign}</span>}
                {city.drivers && <span className="px-2 py-1 rounded bg-[#f0f0f0]">Водители: {city.drivers}</span>}
                {city.bpla && <span className="px-2 py-1 rounded bg-[#f0f0f0]">БПЛА: {city.bpla}</span>}
                {city.programs && <span className="px-2 py-1 rounded bg-[#f0f9ff] text-[#0369a1]">Программы: {city.programs}</span>}
                {city.relations && <span className="px-2 py-1 rounded bg-[#f0f0f0]">Отношения: {city.relations}</span>}
              </div>

              {city.matches.length > 0 && (
                <div className="space-y-1 mb-2">
                  {city.matches.map((m, i) => (
                    <div key={i} className="text-sm text-green-700">✓ {m}</div>
                  ))}
                </div>
              )}

              {city.mismatches.length > 0 && (
                <div className="space-y-1 mb-2">
                  {city.mismatches.map((m, i) => (
                    <div key={i} className="text-sm text-red-600">✕ {m}</div>
                  ))}
                </div>
              )}

              {city.note && <p className="text-xs text-[#5c4d3d] mt-2 leading-relaxed">{city.note}</p>}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <p className="text-sm" style={{ color: '#5c4d3d' }}>
          Заполните параметры и нажмите «Подобрать направления».
        </p>
      )}
    </div>
  )
}
