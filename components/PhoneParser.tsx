'use client'

import { useState } from 'react'

interface ParsedPhone {
  phone: string
  context: string
}

export default function PhoneParser() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [phones, setPhones] = useState<ParsedPhone[]>([])
  const [error, setError] = useState('')
  const [telegramStatus, setTelegramStatus] = useState('')

  async function parse() {
    setLoading(true)
    setError('')
    setPhones([])
    setTelegramStatus('')

    try {
      const res = await fetch('/api/parse-phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setPhones(data.phones || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function downloadExcel() {
    if (phones.length === 0) return
    const rows = [
      ['Телефон', 'Контекст', 'Источник'],
      ...phones.map((p) => [p.phone, p.context, url]),
    ]
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `phones_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function sendToTelegram() {
    setTelegramStatus('Отправка...')
    try {
      const res = await fetch('/api/parse-phones/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones, url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setTelegramStatus('Отправлено')
    } catch (e: any) {
      setTelegramStatus(e.message)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <h2 className="font-semibold">Парсер телефонов с сайта</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={parse}
          disabled={loading || !url}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Парсим...' : 'Найти телефоны'}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {phones.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500"
            >
              Сохранить в Excel
            </button>
            <button
              onClick={sendToTelegram}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-400"
            >
              Отправить в Telegram
            </button>
          </div>

          {telegramStatus && <div className="text-sm text-gray-600">{telegramStatus}</div>}

          <div className="text-sm text-gray-600">Найдено {phones.length} номеров</div>
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {phones.map((p, i) => (
              <div key={i} className="p-3 border-b last:border-b-0 text-sm">
                <div className="font-medium text-blue-600">{p.phone}</div>
                <div className="text-gray-500 truncate">{p.context}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phones.length === 0 && !loading && !error && url && (
        <div className="text-sm text-gray-500">Телефоны не найдены</div>
      )}
    </div>
  )
}
