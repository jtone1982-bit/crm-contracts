import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PIPELINE_STATUSES } from '@/lib/types'

export default async function CandidatesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  let query = supabase.from('candidates').select('*')
  if (profile.role === 'manager') {
    query = query.eq('manager_id', profile.id)
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: candidates } = await query.order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {searchParams.status ? searchParams.status : 'Все кандидаты'}
        </h1>
        <a href="/" className="text-blue-600 hover:underline">← Назад</a>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/candidates" className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50">Все</Link>
        {PIPELINE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/candidates?status=${encodeURIComponent(status)}`}
            className={`px-3 py-1 text-sm border rounded-full hover:bg-gray-50 ${searchParams.status === status ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            {status}
          </Link>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Телефон</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Откуда</th>
              <th className="p-3">Куда</th>
              <th className="p-3">Следующий контакт</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {candidates?.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/candidates/${c.id}`} className="text-blue-600 hover:underline">{c.phone}</Link>
                </td>
                <td className="p-3">{c.full_name || '—'}</td>
                <td className="p-3">{c.city_from || '—'}</td>
                <td className="p-3">{c.city_to || '—'}</td>
                <td className="p-3">{c.next_contact_date || '—'}</td>
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
              <span className="text-xs text-gray-500">{c.next_contact_date || '—'}</span>
            </div>
            <div className="mt-2 text-sm text-gray-900">{c.full_name || '—'}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <span>{c.city_from || '—'} → {c.city_to || '—'}</span>
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
