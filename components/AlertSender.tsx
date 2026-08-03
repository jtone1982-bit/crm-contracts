'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Manager {
  id: string
  full_name: string | null
}

export default function AlertSender({ managers }: { managers: Manager[] }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [importance, setImportance] = useState('Обычная')
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setLoading(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('alerts').insert({
      title: title.trim(),
      body: body.trim(),
      importance,
      created_by: user.id,
      target_manager_ids: targetIds.length > 0 ? targetIds : null,
    })

    if (error) {
      setMessage('Ошибка: ' + error.message)
    } else {
      setMessage('✅ Алерт отправлен!')
      setTitle('')
      setBody('')
      setTargetIds([])
    }
    setLoading(false)
  }

  const toggleManager = (id: string) => {
    setTargetIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: '#f7f8f8' }}>📢 Отправить алерт</h2>

      {message && <div className="text-sm" style={{ color: message.includes('Ошибка') ? '#f87171' : '#4ade80' }}>{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: '#8a8f98' }}>Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: '#0f1011', border: '1px solid rgba(255,255,255,0.1)', color: '#f7f8f8' }}
            placeholder="Например: Срочное сообщение"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: '#8a8f98' }}>Текст</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: '#0f1011', border: '1px solid rgba(255,255,255,0.1)', color: '#f7f8f8' }}
            placeholder="Текст сообщения..."
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: '#8a8f98' }}>Важность</label>
          <select
            value={importance}
            onChange={(e) => setImportance(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: '#0f1011', border: '1px solid rgba(255,255,255,0.1)', color: '#f7f8f8' }}
          >
            <option value="Обычная">Обычная</option>
            <option value="Важная">Важная</option>
            <option value="Критичная">Критичная</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: '#8a8f98' }}>Кому отправить</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTargetIds([])}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${targetIds.length === 0 ? 'text-white' : ''}`}
              style={targetIds.length === 0 ? { background: '#5e6ad2', borderColor: '#5e6ad2' } : { background: '#0f1011', borderColor: 'rgba(255,255,255,0.1)', color: '#8a8f98' }}
            >
              Всем
            </button>
            {managers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleManager(m.id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${targetIds.includes(m.id) ? 'text-white' : ''}`}
                style={targetIds.includes(m.id) ? { background: '#5e6ad2', borderColor: '#5e6ad2' } : { background: '#0f1011', borderColor: 'rgba(255,255,255,0.1)', color: '#8a8f98' }}
              >
                {m.full_name || m.id.slice(0, 6)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ background: '#5e6ad2' }}
        >
          {loading ? 'Отправляем...' : '📣 Отправить алерт'}
        </button>
      </form>
    </div>
  )
}
