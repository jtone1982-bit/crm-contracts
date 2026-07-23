import { requireAdmin } from '@/lib/guards'

export default async function AdminTrainingPage() {
  const { supabase, user, profile } = await requireAdmin()

  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, slug, title, passing_score, is_final, order_index')
    .eq('active', true)
    .order('order_index', { ascending: true })

  const { data: progress } = await supabase
    .from('training_progress')
    .select('user_id, module_id, status, best_score, attempts_count, completed_at')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, approved, active')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  const modulesMap = new Map(modules?.map((m) => [m.id, m]) || [])
  const progressMap = new Map<string, any>()
  progress?.forEach((p) => {
    const key = `${p.user_id}-${p.module_id}`
    progressMap.set(key, p)
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#2d2520' }}>Результаты обучения</h1>

      {!profiles || profiles.length === 0 ? (
        <div className="p-8 text-center text-gray-500 rounded-xl bg-white border">Нет пользователей для отслеживания</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Пользователь</th>
                <th className="p-3">Роль</th>
                {modules?.map((m) => (
                  <th key={m.id} className="p-3 text-center">
                    {m.title}
                    <div className="text-[10px] text-gray-500 font-normal">{m.passing_score}%</div>
                  </th>
                ))}
                <th className="p-3">Итого</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                let passedCount = 0
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{p.full_name || '—'}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td className="p-3 capitalize">{p.role}</td>
                    {modules?.map((m) => {
                      const prog = progressMap.get(`${p.id}-${m.id}`)
                      const isPassed = prog?.status === 'completed'
                      if (isPassed) passedCount++
                      return (
                        <td key={m.id} className="p-3 text-center">
                          {prog ? (
                            <div
                              className={`inline-flex flex-col items-center px-2 py-1 rounded ${
                                isPassed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              <span className="font-bold">{prog.best_score}%</span>
                              <span className="text-[10px]">{prog.attempts_count} попыток</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="p-3">
                      <span className={`font-bold ${passedCount === modules?.length ? 'text-green-700' : 'text-[#c2410c]'}`}>
                        {passedCount} / {modules?.length || 0}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
