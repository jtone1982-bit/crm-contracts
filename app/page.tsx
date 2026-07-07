import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PipelineStatus, PIPELINE_STATUSES } from '@/lib/types'
import ExcelImportButton from '@/components/ExcelImportButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile) {
    redirect('/login')
  }

  let query = supabase.from('candidates').select('*', { count: 'exact' })
  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }

  const { data: candidates, count } = await query.order('created_at', { ascending: false })

  const byStatus = PIPELINE_STATUSES.reduce((acc, status) => {
    acc[status] = candidates?.filter((c) => c.status === status).length || 0
    return acc
  }, {} as Record<PipelineStatus, number>)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Кандидаты</h1>
        <div className="flex flex-wrap gap-2">
          {profile.role === 'admin' && (
            <>
              <Link href="/admin/managers" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">
                Менеджеры
              </Link>
              <Link href="/messages" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
                Чат
              </Link>
              <a href="/api/export" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">
                Экспорт Excel
              </a>
              <form action="/api/import" method="get">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
                  Импорт из Sheets
                </button>
              </form>
              <ExcelImportButton />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {PIPELINE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/candidates?status=${encodeURIComponent(status)}`}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="text-2xl font-bold text-blue-600">{byStatus[status] || 0}</div>
            <div className="text-sm text-gray-600 mt-1">{status}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Телефон</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Куда</th>
              <th className="p-3">Дата создания</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {candidates?.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/candidates/${c.id}`} className="text-blue-600 hover:underline">
                    {c.phone}
                  </Link>
                </td>
                <td className="p-3">{c.full_name || '—'}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{c.city_to || '—'}</td>
                <td className="p-3">{new Date(c.created_at).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {candidates?.map((c) => (
          <Link
            key={c.id}
            href={`/candidates/${c.id}`}
            className="block bg-white border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-medium">{c.phone}</span>
              <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="mt-2 text-sm text-gray-900">{c.full_name || '—'}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-0.5 bg-gray-100 rounded">{c.status}</span>
              <span>→ {c.city_to || '—'}</span>
            </div>
          </Link>
        ))}
      </div>

      {(!candidates || candidates.length === 0) && (
        <div className="p-8 text-center text-gray-500">Нет кандидатов</div>
      )}
    </div>
  )
}
