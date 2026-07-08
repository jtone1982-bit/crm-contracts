import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { formatActivityTime, formatRelativeTime } from '@/lib/datetime'
import { ManagerDepartmentSelect } from '@/components/ManagerDepartmentSelect'

export default async function ManagersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const { data: managers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  const { data: departments } = await supabase.from('departments').select('*').order('name')

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: userList } = await serviceSupabase.auth.admin.listUsers()
  const signInMap = new Map((userList?.users || []).map((u) => [u.id, u.last_sign_in_at]))

  async function addManager(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const isAdmin = formData.get('isAdmin') === 'true'

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user')
    }

    await serviceSupabase.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: isAdmin ? 'admin' : 'manager',
      approved: true,
      active: true,
    })

    revalidatePath('/admin/managers')
  }

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

      <form action={addManager} className="bg-white border rounded-lg p-4 space-y-4 max-w-md">
        <h2 className="font-semibold">Добавить менеджера</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Пароль</label>
          <input name="password" type="password" required minLength={6} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ФИО</label>
          <input name="fullName" type="text" required className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input name="isAdmin" type="checkbox" value="true" className="w-4 h-4" />
            Сделать администратором
          </label>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-500">
          Добавить
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Был на сайте</th>
              <th className="p-3">Последний вход</th>
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
                <td className="p-3">{formatActivityTime(m.last_active_at)}</td>
                <td className="p-3">{formatActivityTime(signInMap.get(m.id) || null)}</td>
                <td className="p-3 space-y-2">
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

                  <ManagerDepartmentSelect
                    userId={m.id}
                    departmentId={m.department_id}
                    departments={departments || []}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {managers?.map((m) => (
          <div key={m.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{m.email}</span>
              {m.approved ? (
                <span className="text-xs text-green-600">Активен</span>
              ) : (
                <span className="text-xs text-yellow-600">На модерации</span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-700">{m.full_name || '—'}</div>
            <div className="mt-2 text-xs text-gray-500">
              Был на сайте: {formatActivityTime(m.last_active_at)}
            </div>
            <div className="text-xs text-gray-500">
              Вход: {formatActivityTime(signInMap.get(m.id) || null)}
            </div>
            <div className="mt-3 space-y-2">
              <form action={approve} className="inline">
                <input type="hidden" name="userId" value={m.id} />
                <input type="hidden" name="approved" value={(!m.approved).toString()} />
                <button
                  type="submit"
                  className={`w-full px-3 py-2 rounded text-white text-sm ${m.approved ? 'bg-red-500 hover:bg-red-400' : 'bg-green-500 hover:bg-green-400'}`}
                >
                  {m.approved ? 'Деактивировать' : 'Одобрить'}
                </button>
              </form>

              <ManagerDepartmentSelect
                userId={m.id}
                departmentId={m.department_id}
                departments={departments || []}
              />
            </div>
          </div>
        ))}
      </div>

      {(!managers || managers.length === 0) && (
        <div className="p-8 text-center text-gray-500">Нет менеджеров</div>
      )}
    </div>
  )
}
