import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function ManagersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  if (profile.role !== 'admin') {
    redirect('/')
  }

  const { data: managers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  async function approve(formData: FormData) {
    'use server'
    const userId = formData.get('userId') as string
    const approved = formData.get('approved') === 'true'

    const adminSupabase = await createClient()
    await adminSupabase
      .from('profiles')
      .update({ approved, active: approved })
      .eq('id', userId)

    revalidatePath('/admin/managers')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Менеджеры</h1>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {managers?.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{m.email}</td>
                <td className="p-3">{m.full_name || '—'}</td>
                <td className="p-3">
                  {m.approved ? (
                    <span className="text-green-600">Активен</span>
                  ) : (
                    <span className="text-yellow-600">На модерации</span>
                  )}
                </td>
                <td className="p-3">
                  <form action={approve} className="inline">
                    <input type="hidden" name="userId" value={m.id} />
                    <input type="hidden" name="approved" value={(!m.approved).toString()} />
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded text-white ${m.approved ? 'bg-red-500 hover:bg-red-400' : 'bg-green-500 hover:bg-green-400'}`}
                    >
                      {m.approved ? 'Деактивировать' : 'Одобрить'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
