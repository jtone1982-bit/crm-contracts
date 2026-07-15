import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#333',
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '18px', marginBottom: '24px', color: '#666' }}>Страница не найдена</p>
      <Link
        href="/"
        style={{
          padding: '10px 24px',
          background: '#b5421f',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '16px',
        }}
      >
        На главную
      </Link>
    </div>
  )
}