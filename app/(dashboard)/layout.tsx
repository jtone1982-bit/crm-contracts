import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MobileSidebar from '@/components/MobileSidebar'
import Heartbeat from '@/components/Heartbeat'
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

  // Get theme from user_metadata
  const themeName = (user.user_metadata?.theme as string) || 'terracotta'
  const theme = getTheme(themeName)

  const links = [
    {
      href: '/',
      label: 'Кандидаты',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h12M3 9h12M3 14h7" /></svg>,
    },
    {
      href: '/calendar',
      label: 'Календарь',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="12" height="11" rx="1.5" /><path d="M6 2.5v3M12 2.5v3M3 7.5h12" /></svg>,
    },
    {
      href: '/messages',
      label: 'Сообщения',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 5.5l7 4.5 7-4.5M2 5.5v8h14v-8M2 5.5L9 2l7 3.5" /></svg>,
    },
    ...(profile.role === 'admin' ? [{
      href: '/reports',
      label: 'Отчёты',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 15V8M7 15V4M11 15v-6M15 15V2" /></svg>,
    }] : []),
    {
      href: '/profile',
      label: 'Профиль',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="6" r="3" /><path d="M3.5 15.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /></svg>,
    },
    ...(profile.role === 'admin' ? [{
      href: '/admin/managers',
      label: 'Менеджеры',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /><path d="M1 15c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M9 15c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" /></svg>,
    }] : []),
    {
      href: '/tools',
      label: 'Инструменты',
      icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 2L14 9l-5 1-1 5L4 2z" /></svg>,
    },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: theme.bg }}>
      <Heartbeat />

      <MobileSidebar links={links} profile={profile} theme={theme} />

      {/* Main content */}
      <div className="flex-1 md:ml-[230px] min-h-screen">
        <main className="p-6 max-w-7xl mx-auto pt-14 md:pt-6">{children}</main>
      </div>
    </div>
  )
}