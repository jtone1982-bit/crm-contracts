'use client'

import { useRef, useState } from 'react'

export default function ExcelImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ imported: data.imported || 0, duplicates: data.duplicates || 0 })
        window.location.reload()
      } else {
        alert(data.error || 'Ошибка импорта')
      }
    } catch (err) {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={fileInputRef}
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? 'Загрузка...' : 'Загрузить Excel'}
      </button>
      {result && (
        <div className="absolute top-full mt-1 right-0 bg-white border rounded-lg p-2 text-xs shadow-md whitespace-nowrap z-10">
          Импортировано: {result.imported}<br />
          Дубликатов: {result.duplicates}
        </div>
      )}
    </div>
  )
}
