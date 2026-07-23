'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface NewsItem {
  id: string
  title: string | null
  content: string
  created_at: string
  profiles?: { full_name: string | null } | null
}

interface NewsPageClientProps {
  isAdmin: boolean
}

export default function NewsPageClient({ isAdmin }: NewsPageClientProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    const res = await fetch('/api/news')
    const data = await res.json()
    setNews(data.news || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })

    if (res.ok) {
      setTitle('')
      setContent('')
      await loadNews()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      const data = await res.json()
      alert(data.error || 'Ошибка')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить новость?')) return
    const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      await loadNews()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Новости компании</h1>
        <Link href="/messages" className="text-blue-600 hover:underline">← Назад</Link>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {loading && <div className="text-sm text-gray-400">Загрузка...</div>}
        {!loading && news.length === 0 && (
          <div className="text-sm text-gray-400">Пока нет новостей</div>
        )}
        {news.map((item) => (
          <div key={item.id} className="border-b last:border-0 pb-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{item.title || 'Новость'}</div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Удалить
                </button>
              )}
            </div>
            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.content}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(item.created_at).toLocaleString('ru-RU')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
          <textarea
            placeholder="Текст новости..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Опубликовать
          </button>
        </form>
      )}
    </div>
  )
}
