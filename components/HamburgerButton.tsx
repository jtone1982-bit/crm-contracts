'use client'

import { useState } from 'react'

export default function HamburgerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
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

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[55]"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <style>{`aside.mobile-sidebar { transform: translateX(0) !important; }`}</style>
      )}
    </>
  )
}