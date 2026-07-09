import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>
}) {
  const params = await searchParams
  const error = params.error ? decodeURIComponent(params.error) : ''
  const isSignUp = params.mode === 'signup'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  return (
    <html>
      <head>
        <title>CRM Контракты — Вход</title>
        <style>{
          `* { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f3f4f6;
            color: #111827;
            min-height: 100vh;
          }
          nav {
            background: #fff;
            border-bottom: 1px solid #e5e7eb;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          nav a {
            color: #111827;
            text-decoration: none;
            font-weight: 700;
          }
          nav a:hover { color: #2563eb; }
          .chat-link {
            padding: 8px 16px;
            background: #2563eb;
            color: #fff;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
          }
          main {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 58px);
            padding: 16px;
          }
          .card {
            background: #fff;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
          }
          h1 { margin: 0 0 8px; font-size: 24px; text-align: center; }
          p.subtitle { margin: 0 0 24px; color: #6b7280; font-size: 14px; text-align: center; }
          .error {
            background: #fef2f2;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 16px;
          }
          label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
          input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 16px;
          }
          input:focus { outline: 2px solid #2563eb; outline-offset: 0; border-color: #2563eb; }
          button[type="submit"] {
            width: 100%;
            background: #2563eb;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }
          button[type="submit"]:hover { background: #1d4ed8; }
          .toggle {
            width: 100%;
            margin-top: 16px;
            background: none;
            border: none;
            color: #2563eb;
            font-size: 14px;
            cursor: pointer;
          }
          .toggle:hover { text-decoration: underline; }
          .hidden { display: none; }
        `}</style>
      </head>
      <body>
        <nav>
          <Link href="/">CRM Контракты</Link>
          <Link href="/messages" className="chat-link">Чат</Link>
        </nav>
        <main>
          <div className="card">
            <h1>CRM Контракты</h1>
            <p className="subtitle">{isSignUp ? 'Регистрация нового менеджера' : 'Вход в систему'}</p>

            {error && <div className="error">{error}</div>}

            <form action="/api/auth" method="post">
              <input type="hidden" name="mode" value={isSignUp ? 'signup' : 'login'} />
              <div>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>

              <div className={isSignUp ? '' : 'hidden'}>
                <label htmlFor="fullName">ФИО</label>
                <input type="text" id="fullName" name="fullName" required={isSignUp} />
              </div>

              <div>
                <label htmlFor="password">Пароль</label>
                <input type="password" id="password" name="password" required />
              </div>

              <button type="submit">{isSignUp ? 'Зарегистрироваться' : 'Войти'}</button>
            </form>

            <form method="get" action="/login">
              <input type="hidden" name="mode" value={isSignUp ? 'login' : 'signup'} />
              <button type="submit" className="toggle">
                {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
              </button>
            </form>
          </div>
        </main>
      </body>
    </html>
  )
}
