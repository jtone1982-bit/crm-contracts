import { NextResponse } from 'next/server'

interface LinkPreviewData {
  title?: string
  description?: string
  image?: string
  url: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL не указан' }, { status: 400 })
  }

  try {
    const parsedUrl = new URL(url)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRM Preview Bot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Не удалось загрузить страницу' }, { status: 502 })
    }

    const html = await response.text()

    const getMeta = (name: string) => {
      const regex = new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
        'i'
      )
      const match = html.match(regex)
      return match?.[1]
    }

    const title = getMeta('og:title') || getMeta('title') || html.match(/<title>([^]*?)<\/title>/i)?.[1]?.trim() || parsedUrl.hostname
    const description = getMeta('og:description') || getMeta('description')
    let image = getMeta('og:image') || getMeta('twitter:image')
    if (image && !image.startsWith('http')) {
      image = new URL(image, url).href
    }

    const data: LinkPreviewData = {
      url,
      title: title || parsedUrl.hostname,
      description,
      image,
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('[link-preview] error', e.message)
    return NextResponse.json({ error: 'Не удалось получить предпросмотр' }, { status: 500 })
  }
}
