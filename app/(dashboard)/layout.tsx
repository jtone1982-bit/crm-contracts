import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile?.approved) {
    redirect('/pending')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-lg">CRM Контракты</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{profile.email}</span>
          <span className="px-2 py-1 bg-gray-100 rounded">{profile.role === 'admin' ? 'Админ' : 'Менеджер'}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-red-600 hover:underline">Выйти</button>
          </form>
        </div>
      </nav>
      <main className="p-4 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
