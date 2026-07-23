import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Heartbeat from '@/components/Heartbeat'
import MobileMenuToggle from '@/components/MobileMenuToggle'
import { getTheme } from '@/lib/themes'

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

  const themeName = (user.user_metadata?.theme as string) || 'terracotta'
  const theme = getTheme(themeName)

  const initials = (profile.full_name || profile.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('')

  const isStudent = profile?.role === 'student'

  const allNavLinks = [
    { href: '/', label: 'Кандидаты' },
    { href: '/calendar', label: 'Календарь' },
    { href: '/messages', label: 'Сообщения' },
    { href: '/training', label: 'Обучение' },
    ...(profile.role === 'admin' ? [{ href: '/reports', label: 'Отчёты' }] : []),
    { href: '/profile', label: 'Профиль' },
    ...(profile.role === 'admin' ? [{ href: '/admin/managers', label: 'Менеджеры' }] : []),
    { href: '/tools', label: 'Инструменты' },
  ]

  const navLinks = isStudent
    ? [
        { href: '/training', label: 'Обучение' },
        { href: '/profile', label: 'Профиль' },
      ]
    : allNavLinks

  return (
    <div className="min-h-screen flex" style={{ background: theme.bg }}>
      <Heartbeat />
      <MobileMenuToggle />

      {/* Sidebar — server rendered */}
      <aside
        className="mobile-sidebar fixed left-0 top-0 bottom-0 w-[230px] flex flex-col z-[56] transition-transform duration-200"
        style={{ background: theme.sidebarBg, borderRight: `1px solid ${theme.textMuted}15` }}
      >
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-white font-extrabold text-[15px]"
              style={{ background: theme.accent, boxShadow: `0 2px 8px ${theme.accent}33` }}
            >
              К
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: theme.text }}>
              CRM Контракты
            </span>
          </Link>
          <button
            className="md:hidden w-8 h-8 rounded flex items-center justify-center"
            style={{ color: theme.textMuted }}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pt-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-black/5"
              style={{ color: theme.textSecondary }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t" style={{ borderColor: `${theme.textMuted}15` }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #d4c9bc, #b5a89a)',
                border: '2px solid white',
                boxShadow: `0 0 0 1px ${theme.textMuted}15`,
                color: '#5a4d40',
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold truncate" style={{ color: theme.text }}>
                {profile.full_name?.trim() || profile.email}
              </div>
              <div className="text-[11px]" style={{ color: theme.textMuted }}>
                {profile.role === 'admin' ? 'Админ' : 'Менеджер'}
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-[15px] leading-none p-1 rounded transition hover:text-red-600"
                style={{ color: theme.textMuted }}
                title="Выйти"
              >
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile content offset */}
      <div className="flex-1 md:ml-[230px] min-h-screen">
        <main className="p-6 max-w-7xl mx-auto pt-14 md:pt-6">{children}</main>
      </div>
    </div>
  )
}