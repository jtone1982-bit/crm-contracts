'use client'

import { useEffect, useState } from 'react'
import AvatarUpload from '@/components/AvatarUpload'
import Link from 'next/link'
import { formatActivityTime, formatRelativeTime } from '@/lib/datetime'

interface SocialLink {
  platform: string
  url: string
}

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [additionalEmail, setAdditionalEmail] = useState('')
  const [address, setAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [socials, setSocials] = useState<SocialLink[]>([{ platform: '', url: '' }])
  const [theme, setTheme] = useState('terracotta')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [lastActiveAt, setLastActiveAt] = useState<string | null>(null)
  const [lastSignInAt, setLastSignInAt] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        const meta = data.user_metadata || {}
        setFullName(meta.full_name || '')
        setPhone(meta.phone || '')
        setAdditionalEmail(meta.additional_email || '')
        setAddress(meta.address || '')
        setAvatarUrl(meta.avatar_url || '')
        setTheme(meta.theme || 'terracotta')
        setUserId(data.user_metadata?.sub || '')
        setLastActiveAt(data.last_active_at || null)
        setLastSignInAt(data.last_sign_in_at || null)
        setSocials(
          Array.isArray(meta.social_links) && meta.social_links.length > 0
            ? meta.social_links
            : [{ platform: '', url: '' }]
        )
      })
  }, [])

  function addSocial() {
    setSocials([...socials, { platform: '', url: '' }])
  }

  function updateSocial(index: number, field: keyof SocialLink, value: string) {
    const next = [...socials]
    next[index][field] = value
    setSocials(next)
  }

  function removeSocial(index: number) {
    setSocials(socials.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        additional_email: additionalEmail,
        address,
        avatar_url: avatarUrl,
        theme,
        social_links: socials.filter((s) => s.platform && s.url),
      }),
    })

    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setMessage('Профиль сохранён')
    } else {
      setMessage(data.error || 'Ошибка сохранения')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#2d2520' }}>Мой профиль</h1>
          <p className="text-sm mt-0.5" style={{ color: '#a89a8c' }}>Личные данные и настройки</p>
        </div>
        <Link href="/" className="hover:underline" style={{ color: '#c2410c' }}>← Назад</Link>
      </div>

      {message && (
        <div
          className={`p-3 rounded ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#fefdfb] border rounded-xl p-6 space-y-4" style={{ borderColor: 'rgba(60,50,40,0.08)' }}>
        <div className="space-y-1 text-sm rounded-lg p-3" style={{ background: 'rgba(245,241,234,0.8)', color: '#6b5d50' }}>
          <div>Был на сайте: {formatActivityTime(lastActiveAt)} {lastActiveAt && `(${formatRelativeTime(lastActiveAt)})`}</div>
          <div>Последний вход: {formatActivityTime(lastSignInAt)} {lastSignInAt && `(${formatRelativeTime(lastSignInAt)})`}</div>
        </div>

        <div className="flex justify-center">
          <AvatarUpload currentUrl={avatarUrl} onUpload={setAvatarUrl} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ФИО</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Телефон</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Дополнительный email</label>
          <input
            type="email"
            value={additionalEmail}
            onChange={(e) => setAdditionalEmail(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Адрес</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Социальные сети</label>
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="Telegram"
                value={s.platform}
                onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                className="flex-1 border rounded-lg p-2"
              />
              <input
                type="url"
                placeholder="https://t.me/..."
                value={s.url}
                onChange={(e) => updateSocial(i, 'url', e.target.value)}
                className="flex-[2] border rounded-lg p-2"
              />
              <button
                type="button"
                onClick={() => removeSocial(i)}
                className="px-3 text-red-600 border rounded-lg hover:bg-red-50"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocial}
            className="text-sm hover:underline"
            style={{ color: '#c2410c' }}
          >
            + Добавить ссылку
          </button>
        </div>

        {/* Theme selector */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: '#6b5d50' }}>Тема оформления</label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'terracotta', name: 'Терракота', accent: '#c2410c', bg: '#f5f1ea' },
              { id: 'sage', name: 'Мята', accent: '#4a7c59', bg: '#f0f4f0' },
              { id: 'lavender', name: 'Лаванда', accent: '#7c5d8c', bg: '#f5f0f7' },
              { id: 'ocean', name: 'Океан', accent: '#2c5f7c', bg: '#eef4f7' },
              { id: 'graphite', name: 'Графит', accent: '#3a3a3a', bg: '#f0f0f0' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className="px-4 py-2 rounded-lg border-2 transition flex items-center gap-2"
                style={{
                  borderColor: theme === t.id ? t.accent : 'rgba(60,50,40,0.12)',
                  background: t.bg,
                }}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: t.accent }} />
                <span className="text-sm font-semibold" style={{ color: '#2d2520' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
          style={{ background: '#c2410c', color: 'white' }}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
      <Link href={`/messages/${userId}`} className="w-full mt-4 py-2.5 rounded-lg font-semibold transition text-center block" style={{ background: '#c2410c', color: 'white' }}>
        Написать личное сообщение
      </Link>
    </div>
  )
}
