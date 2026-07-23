import { requireAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { formatActivityTime } from '@/lib/datetime'
import { ManagerDepartmentSelect } from '@/components/ManagerDepartmentSelect'

export default async function ManagersPage() {
  const { supabase, user, profile } = await requireAdmin()

  const { data: managers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  const { data: departments, error: deptError } = await supabase.from('departments').select('*').order('name')
  if (deptError) console.error('departments fetch error', deptError.message)

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
    const role = (formData.get('role') as string) || 'manager'

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
      role,
      approved: true,
      active: true,
    })

    revalidatePath('/admin/managers')
  }

  async function changeRole(formData: FormData) {
    'use server'
    const userId = formData.get('userId') as string
    const newRole = formData.get('newRole') as string

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await serviceSupabase.from('profiles').update({ role: newRole }).eq('id', userId)

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
          <label className="block text-sm font-medium mb-1">Роль</label>
          <select name="role" required className="w-full border rounded-lg px-3 py-2 bg-white">
            <option value="manager">Менеджер</option>
            <option value="student">Студент (только обучение)</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-500">
          Добавить
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">ФИО</th>
              <th className="p-3">Роль</th>
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
                <td className="p-3 capitalize">{m.role}</td>
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

                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={m.id} />
                    <select name="newRole" defaultValue={m.role} className="border rounded px-2 py-1 text-sm">
                      <option value="manager">Менеджер</option>
                      <option value="student">Студент</option>
                      <option value="admin">Админ</option>
                    </select>
                    <button type="submit" className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">
                      Сменить роль
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
            <div className="mt-1 text-xs text-gray-500 capitalize">Роль: {m.role}</div>
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

              <form action={changeRole} className="flex items-center gap-2">
                <input type="hidden" name="userId" value={m.id} />
                <select name="newRole" defaultValue={m.role} className="flex-1 border rounded px-2 py-2 text-sm">
                  <option value="manager">Менеджер</option>
                  <option value="student">Студент</option>
                  <option value="admin">Админ</option>
                </select>
                <button type="submit" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm">
                  Сменить
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
