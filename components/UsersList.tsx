'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  approved: boolean | null
  active: boolean | null
  created_at: string
  candidates_count: number
}

interface Manager {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

interface UsersListProps {
  users: User[]
  managers: Manager[]
  searchQuery?: string
}

export default function UsersList({ users, managers, searchQuery }: UsersListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transferManagerId, setTransferManagerId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    if (user.candidates_count > 0 && !transferManagerId) {
      setMessage('Выберите менеджера для переноса кандидатов')
      return
    }

    if (!confirm(`Удалить ${user.full_name || user.email}?${user.candidates_count > 0 ? ` Его ${user.candidates_count} кандидатов перейдут к выбранному менеджеру.` : ''}`)) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transferToManagerId: user.candidates_count > 0 ? transferManagerId : undefined,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage(`Удалено. Перенесено кандидатов: ${json.transferred || 0}`)
        setDeletingId(null)
        setTransferManagerId('')
        setTimeout(() => window.location.reload(), 700)
      } else {
        setMessage(json.error || 'Ошибка удаления')
      }
    } catch (e) {
      setMessage('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#2d2520' }}>Пользователи</h1>
      </div>

      <form method="get" action="/admin/users" className="flex flex-wrap items-center gap-3 bg-white border rounded-lg p-3">
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Поиск по имени или email"
          className="text-sm border rounded-lg px-3 py-2"
          style={{ borderColor: 'rgba(60,50,40,0.12)', minWidth: '220px' }}
        />
        <button
          type="submit"
          className="text-sm px-4 py-2 rounded-lg text-white"
          style={{ background: '#c2410c' }}
        >
          Найти
        </button>
        {searchQuery && (
          <a
            href="/admin/users"
            className="text-sm px-4 py-2 rounded-lg border"
            style={{ borderColor: 'rgba(60,50,40,0.12)', color: '#2d2520' }}
          >
            Сбросить
          </a>
        )}
      </form>

      {message && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            background: message.includes('Ошибка') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('Ошибка') ? '#dc2626' : '#16a34a',
            border: `1px solid ${message.includes('Ошибка') ? '#fecaca' : '#bbf7d0'}`,
          }}
        >
          {message}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto" style={{ borderColor: 'rgba(60,50,40,0.08)' }}>
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Пользователь</th>
              <th className="p-3">Роль</th>
              <th className="p-3">Кандидатов</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Нет пользователей</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium" style={{ color: '#2d2520' }}>{u.full_name || '—'}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">{u.candidates_count}</td>
                  <td className="p-3">
                    {!u.approved && <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">На рассмотрении</span>}
                    {u.active === false && <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 ml-1">Отключён</span>}
                  </td>
                  <td className="p-3">
                    {deletingId === u.id ? (
                      <div className="flex flex-col gap-2">
                        {u.candidates_count > 0 && (
                          <select
                            className="text-xs border rounded px-2 py-1"
                            style={{ borderColor: 'rgba(60,50,40,0.12)' }}
                            value={transferManagerId}
                            onChange={(e) => setTransferManagerId(e.target.value)}
                          >
                            <option value="">Кому перенести кандидатов</option>
                            {managers
                              .filter((m) => m.id !== u.id)
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.full_name || m.email || '—'} {m.role === 'admin' ? '(админ)' : ''}
                                </option>
                              ))}
                          </select>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={loading || (u.candidates_count > 0 && !transferManagerId)}
                            className="text-xs px-3 py-1.5 rounded bg-red-600 text-white disabled:opacity-50"
                          >
                            {loading ? 'Удаление...' : 'Подтвердить удаление'}
                          </button>
                          <button
                            onClick={() => { setDeletingId(null); setTransferManagerId(''); setMessage(null) }}
                            className="text-xs px-3 py-1.5 rounded border"
                            style={{ borderColor: 'rgba(60,50,40,0.12)' }}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(u.id)}
                        className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
