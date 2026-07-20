'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
}

export default function MobileSidebar({
  links,
  profile,
}: {
  links: SidebarLink[]
  profile: { full_name: string | null; email: string; role: string }
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
        style={{ background: '#fefdfb', border: '1px solid rgba(60,50,40,0.12)', color: '#2d2520' }}
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

      {/* Sidebar — hidden on mobile, slides in when open */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[230px] flex flex-col z-[56] transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: '#faf7f2', borderRight: '1px solid rgba(60,50,40,0.08)' }}
      >
        {/* Logo + close */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
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
          <button
            onClick={() => setOpen(false)}
            className="md:hidden w-8 h-8 rounded flex items-center justify-center"
            style={{ color: '#a89a8c' }}
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
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline font-semibold text-[13.5px] transition hover:bg-[rgba(60,50,40,0.04)] hover:text-[#2d2520]"
              style={{ color: '#6b5d50' }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
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
    </>
  )
}