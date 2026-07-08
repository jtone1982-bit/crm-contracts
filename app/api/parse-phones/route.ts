import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+7${digits}`
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`
  if (digits.length === 11 && digits.startsWith('9')) return `+7${digits}`
  return null
}

function extractPhones(html: string, baseUrl: string): { phone: string; context: string }[] {
  const seen = new Set<string>()
  const results: { phone: string; context: string }[] = []

  const patterns = [
    /(?:\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
    /(?:\+7|8)\d{10}/g,
    /(?:\+7|8)\s\d{3}\s\d{3}\s\d{2}\s\d{2}/g,
  ]

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const raw = match[0]
      const normalized = normalizePhone(raw)
      if (!normalized || seen.has(normalized)) continue
      seen.add(normalized)

      const start = Math.max(0, match.index - 40)
      const end = Math.min(html.length, match.index + raw.length + 40)
      const context = html.slice(start, end).replace(/\s+/g, ' ').trim()
      results.push({ phone: normalized, context })
    }
  }

  const telLinks = html.matchAll(/href=["']tel:([^"']+)["']/gi)
  for (const match of telLinks) {
    const normalized = normalizePhone(match[1])
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    results.push({ phone: normalized, context: `tel: ${match[1]}` })
  }

  return results
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const url = body.url?.trim()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 })
    }

    const html = await response.text()
    const phones = extractPhones(html, url)

    return NextResponse.json({ url, count: phones.length, phones })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to parse' }, { status: 500 })
  }
}
