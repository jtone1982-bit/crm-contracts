import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Heartbeat from '@/components/Heartbeat'

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

  const initials = (profile.full_name || profile.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('')

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f1ea' }}>
      <Heartbeat />

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-[230px] flex flex-col z-50"
        style={{ background: '#faf7f2', borderRight: '1px solid rgba(60,50,40,0.08)' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-white font-extrabold text-[15px]"
              style={{ background: '#c2410c', boxShadow: '0 2px 8px rgba(194,65,12,0.2)' }}
            >
              К
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: '#2d2520' }}>
              CRM Контракты
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-1">
          <div
            className="px-2.5 pt-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#a89a8c' }}
          >
            Работа
          </div>

          <Link
            href="/"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
            style={{ color: '#6b5d50' }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 4h12M3 9h12M3 14h7" />
            </svg>
            Кандидаты
          </Link>

          <Link
            href="/calendar"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
            style={{ color: '#6b5d50' }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="4" width="12" height="11" rx="1.5" />
              <path d="M6 2.5v3M12 2.5v3M3 7.5h12" />
            </svg>
            Календарь
          </Link>

          <Link
            href="/messages"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
            style={{ color: '#6b5d50' }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 5.5l7 4.5 7-4.5M2 5.5v8h14v-8M2 5.5L9 2l7 3.5" />
            </svg>
            Сообщения
          </Link>

          {profile.role === 'admin' && (
            <Link
              href="/reports"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
              style={{ color: '#6b5d50' }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 15V8M7 15V4M11 15v-6M15 15V2" />
              </svg>
              Отчёты
            </Link>
          )}

          <div
            className="px-2.5 pt-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#a89a8c' }}
          >
            Аккаунт
          </div>

          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
            style={{ color: '#6b5d50' }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="9" cy="6" r="3" />
              <path d="M3.5 15.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
            </svg>
            Профиль
          </Link>

          {profile.role === 'admin' && (
            <Link
              href="/admin/managers"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
              style={{ color: '#6b5d50' }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="5" cy="6" r="2.5" />
                <circle cx="13" cy="6" r="2.5" />
                <path d="M1 15c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M9 15c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" />
              </svg>
              Менеджеры
            </Link>
          )}

          <Link
            href="/tools"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
            style={{ color: '#6b5d50' }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 2L14 9l-5 1-1 5L4 2z" />
            </svg>
            Инструменты
          </Link>
        </nav>

        {/* User card */}
        <div className="p-2 border-t" style={{ borderColor: 'rgba(60,50,40,0.08)' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #d4c9bc, #b5a89a)',
                border: '2px solid white',
                boxShadow: '0 0 0 1px rgba(60,50,40,0.08)',
                color: '#5a4d40',
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold truncate" style={{ color: '#2d2520' }}>
                {profile.full_name?.trim() || profile.email}
              </div>
              <div className="text-[11px]" style={{ color: '#a89a8c' }}>
                {profile.role === 'admin' ? 'Админ' : 'Менеджер'}
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-[15px] leading-none p-1 rounded transition hover:text-red-600"
                style={{ color: '#a89a8c' }}
                title="Выйти"
              >
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[230px] min-h-screen">
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}