'use client'

import LinkPreview from './LinkPreview'

interface MessageContentProps {
  content: string
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g

export default function MessageContent({ content }: MessageContentProps) {
  const parts = content.split(URL_REGEX)
  const urls = content.match(URL_REGEX) || []
  const uniqueUrls = Array.from(new Set(urls))

  return (
    <div className="text-sm">
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {part}
            </a>
          )
        }
        return <span key={i} className="whitespace-pre-wrap break-words">{part}</span>
      })}
      {uniqueUrls.length > 0 && (
        <div className="space-y-2">
          {uniqueUrls.map((url) => (
            <LinkPreview key={url} url={url} />
          ))}
        </div>
      )}
    </div>
  )
}
