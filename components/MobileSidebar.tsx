'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ThemeColors {
  accent: string
  accentHover: string
  accentLight: string
  bg: string
  surface: string
  sidebarBg: string
  text: string
  textSecondary: string
  textMuted: string
}

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
}

export default function MobileSidebar({
  links,
  profile,
  theme,
}: {
  links: SidebarLink[]
  profile: { full_name: string | null; email: string; role: string }
  theme: ThemeColors
}) {
  const [open, setOpen] = useState(false)

  const initials = (profile.full_name || profile.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: theme.surface, border: `1px solid ${theme.textMuted}20`, color: theme.text }}
        aria-label="Меню"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[55]"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[230px] flex flex-col z-[56] transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: theme.sidebarBg, borderRight: `1px solid ${theme.textMuted}15` }}
      >
        {/* Logo + close */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
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
            onClick={() => setOpen(false)}
            className="md:hidden w-8 h-8 rounded flex items-center justify-center"
            style={{ color: theme.textMuted }}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-black/5"
              style={{ color: theme.textSecondary }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User card */}
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
    </>
  )
}