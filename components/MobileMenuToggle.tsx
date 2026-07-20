'use client'

import { useState, useEffect } from 'react'

export default function MobileMenuToggle() {
  const [open, setOpen] = useState(false)

  // Close on route change (popstate)
  useEffect(() => {
    const handler = () => setOpen(false)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
        style={{ background: '#b5421f', color: 'white' }}
        aria-label="Открыть меню"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-[55]"
        />
      )}

      {/* Sidebar open/close control */}
      <style>{`
        .mobile-sidebar { transform: translateX(-100%); }
        @media (min-width: 768px) {
          .mobile-sidebar { transform: translateX(0) !important; }
        }
      `}</style>

      {open && (
        <style>{`
          .mobile-sidebar { transform: translateX(0) !important; }
        `}</style>
      )}
    </>
  )
}