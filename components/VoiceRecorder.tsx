'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface VoiceRecorderProps {
  onRecorded: (content: string, attachmentUrl: string) => void
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [ios, setIos] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    setIos(isIOS())
  }, [])

  const uploadBlob = useCallback(async (blob: Blob) => {
    const mimeType = blob.type || 'audio/webm'
    if (blob.size === 0) return

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: mimeType }),
      })

      if (!res.ok) {
        alert('Не удалось получить ссылку для загрузки')
        return
      }

      const { signedUrl, path } = await res.json()

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': mimeType },
      })

      if (!uploadRes.ok) {
        alert('Не удалось загрузить голосовое сообщение')
        return
      }

      const publicUrlRes = await fetch(`/api/download?path=${encodeURIComponent(path)}`)
      const { url: publicUrl } = await publicUrlRes.json()

      onRecorded('🎤 Голосовое сообщение', publicUrl)
    } catch (e) {
      console.error('[voice recorder] upload error', e)
      alert('Ошибка отправки голосового сообщения')
    }
  }, [onRecorded])

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return

    mediaRecorderRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm'
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })

      chunksRef.current = []
      startTimeRef.current = Date.now()
      setDuration(0)
      setRecording(true)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach((t) => t.stop())
        await uploadBlob(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (e) {
      console.error('[voice recorder] start error', e)
      alert('Не удалось получить доступ к микрофону')
      setRecording(false)
    }
  }, [uploadBlob])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadBlob(file)
    e.target.value = ''
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (ios) {
    return (
      <label className="relative px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
        <input
          type="file"
          accept="audio/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </label>
    )
  }

  return (
    <button
      type="button"
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      className={`relative px-3 py-2 rounded-lg select-none ${
        recording ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      title="Удерживайте для записи голосового сообщения"
    >
      {recording ? (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
          {formatDuration(duration)}
        </span>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}
    </button>
  )
}
