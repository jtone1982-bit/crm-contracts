'use client'

import { useState } from 'react'

export default function HamburgerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--theme-surface, #fefdfb)', border: '1px solid rgba(60,50,40,0.12)', color: 'var(--theme-text, #2d2520)' }}
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

      <style>{`
        aside.mobile-sidebar { transform: translateX(-100%); }
        aside.mobile-sidebar.open { transform: translateX(0); }
      `}</style>

      <script dangerouslySetInnerHTML={{ __html: `
        function toggleSidebar() {
          const el = document.querySelector('aside.mobile-sidebar');
          if (el) {
            el.classList.toggle('open');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.style.display = el.classList.contains('open') ? 'block' : 'none';
          }
        }
        document.addEventListener('DOMContentLoaded', function() {
          const btn = document.querySelector('[aria-label="Меню"]');
          if (btn) btn.addEventListener('click', toggleSidebar);
          const closeBtn = document.querySelector('[aria-label="Закрыть"]');
          if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
          const overlay = document.querySelector('.sidebar-overlay');
          if (overlay) overlay.addEventListener('click', toggleSidebar);
          document.querySelectorAll('aside.mobile-sidebar a').forEach(function(a) {
            a.addEventListener('click', toggleSidebar);
          });
        });
      `}} />
    </>
  )
}