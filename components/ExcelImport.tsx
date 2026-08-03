'use client'

import { useState, useCallback } from 'react'

export default function ExcelImport() {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; duplicates: number; error?: string } | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls') || dropped.name.endsWith('.csv'))) {
      setFile(dropped)
      setResult(null)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/import-excel', { method: 'POST', body: form })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ imported: 0, duplicates: 0, error: err.message || 'Ошибка загрузки' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Импорт кандидатов из Excel</h2>
      <p className="text-sm text-gray-600">
        Перетащите файл Excel (.xlsx, .xls, .csv) или нажмите для выбора.
        В первом столбце должны быть телефоны.
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ' +
          (dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400')
        }
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          className="hidden"
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className="cursor-pointer block">
          {file ? (
            <span className="text-green-600 font-medium">{file.name}</span>
          ) : (
            <span className="text-gray-500">📎 Нажмите или перетащите файл</span>
          )}
        </label>
      </div>
      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Загрузка...' : 'Импортировать'}
        </button>
      )}
      {result && (
        <div className={`p-4 rounded-lg ${result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {result.error ? (
            <p>❌ Ошибка: {result.error}</p>
          ) : (
            <div className="space-y-1">
              <p>✅ Импортировано: <strong>{result.imported}</strong></p>
              {result.duplicates > 0 && <p>⚠️ Дублей пропущено: <strong>{result.duplicates}</strong></p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
