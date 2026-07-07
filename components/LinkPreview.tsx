'use client'

import { useEffect, useState } from 'react'

interface LinkPreviewProps {
  url: string
}

interface PreviewData {
  title: string
  description?: string
  image?: string
  url: string
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(true)
        } else {
          setPreview(data)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [url])

  if (loading) return <div className="text-xs text-gray-400">Загрузка предпросмотра...</div>
  if (error || !preview) return null

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 bg-gray-50 border rounded-lg overflow-hidden hover:bg-gray-100 transition max-w-sm"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt={preview.title}
          className="w-full h-32 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
      <div className="p-3">
        <div className="text-sm font-medium line-clamp-2">{preview.title}</div>
        {preview.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{preview.description}</div>
        )}
        <div className="text-xs text-blue-600 mt-1 truncate">{new URL(preview.url).hostname}</div>
      </div>
    </a>
  )
}
