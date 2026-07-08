'use client'

import { useState, useRef } from 'react'

interface AvatarUploadProps {
  currentUrl?: string
  onUpload: (url: string) => void
}

export default function AvatarUpload({ currentUrl, onUpload }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Поддерживаются только JPG, PNG, WebP. HEIC нужно конвертировать вручную.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        onUpload(data.url)
      } else {
        alert(data.error || 'Не удалось загрузить фото')
      }
    } catch (err) {
      alert('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-24 h-24 rounded-full bg-gray-200 bg-cover bg-center border"
        style={{ backgroundImage: currentUrl ? `url(${currentUrl})` : undefined }}
      >
        {!currentUrl && <span className="flex items-center justify-center h-full text-gray-400 text-xs">Нет фото</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="text-[10px] text-gray-400">JPG, PNG, WebP</div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
      >
        {uploading ? 'Загрузка...' : 'Сменить фото'}
      </button>
    </div>
  )
}
