'use client'

import { useEffect, useState } from 'react'
import AvatarUpload from '@/components/AvatarUpload'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Назад</Link>
      </div>

      {message && (
        <div
          className={`p-3 rounded ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
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
            className="text-sm text-blue-600 hover:underline"
          >
            + Добавить ссылку
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
