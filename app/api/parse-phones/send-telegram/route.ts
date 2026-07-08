import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, telegram_chat_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!profile.telegram_chat_id) {
    return NextResponse.json({ error: 'Telegram не подключён в профиле' }, { status: 400 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot token не настроен' }, { status: 500 })
  }

  const { phones, url } = await request.json()
  if (!phones?.length) {
    return NextResponse.json({ error: 'Нет телефонов для отправки' }, { status: 400 })
  }

  const text = [
    `📞 Найдено ${phones.length} телефонов:`,
    `🔗 ${url}`,
    '',
    ...phones.map((p: any, i: number) => `${i + 1}. ${p.phone}`),
  ].join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text,
      }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.description || 'Telegram error')
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to send' }, { status: 500 })
  }
}
