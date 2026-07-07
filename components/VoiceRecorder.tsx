'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface VoiceRecorderProps {
  onRecorded: (content: string, attachmentUrl: string) => void
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function supportsMediaRecorder() {
  if (typeof window === 'undefined' || !window.MediaRecorder) return false
  return MediaRecorder.isTypeSupported('audio/webm') || MediaRecorder.isTypeSupported('audio/mp4')
}

export default function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const buffersRef = useRef<Float32Array[]>([])

  const uploadBlob = useCallback(async (blob: Blob, fallbackType?: string) => {
    const mimeType = blob.type || fallbackType || 'audio/mpeg'
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

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect()
      sourceRef.current?.disconnect()
      await audioContextRef.current.close()
      audioContextRef.current = null
      sourceRef.current = null
      processorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)
  }, [])

  const startMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm'
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      startTimeRef.current = Date.now()
      setDuration(0)
      setRecording(true)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        await stopRecording()
        await uploadBlob(blob)
      }

      recorder.start()

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (e) {
      console.error('[voice recorder] media recorder error', e)
      alert('Не удалось получить доступ к микрофону')
      setRecording(false)
    }
  }, [stopRecording, uploadBlob])

  function floatTo16BitPCM(input: Float32Array) {
    const output = new DataView(new ArrayBuffer(input.length * 2))
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return output.buffer
  }

  function writeWAV(sampleRate: number, channels: number, samples: Float32Array) {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * 2, true)
    view.setUint16(32, channels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, samples.length * 2, true)

    const pcm = floatTo16BitPCM(samples)
    const pcmView = new Uint8Array(pcm)
    const dataView = new Uint8Array(buffer, 44)
    dataView.set(pcmView)

    return new Blob([buffer], { type: 'audio/wav' })
  }

  const startWebAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      buffersRef.current = []

      processor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0)
        buffersRef.current.push(new Float32Array(data))
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      startTimeRef.current = Date.now()
      setDuration(0)
      setRecording(true)

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (e) {
      console.error('[voice recorder] web audio error', e)
      alert('Не удалось получить доступ к микрофону')
      setRecording(false)
    }
  }, [])

  const stopWebAudio = useCallback(async () => {
    await stopRecording()

    if (buffersRef.current.length === 0) return

    const length = buffersRef.current.reduce((acc, b) => acc + b.length, 0)
    const samples = new Float32Array(length)
    let offset = 0
    for (const b of buffersRef.current) {
      samples.set(b, offset)
      offset += b.length
    }

    const sampleRate = audioContextRef.current?.sampleRate || 44100
    const blob = writeWAV(sampleRate, 1, samples)
    buffersRef.current = []
    await uploadBlob(blob, 'audio/wav')
  }, [stopRecording, uploadBlob])

  const startRecording = useCallback(async () => {
    if (supportsMediaRecorder()) {
      await startMediaRecorder()
    } else {
      await startWebAudio()
    }
  }, [startMediaRecorder, startWebAudio])

  const toggleRecording = useCallback(async () => {
    if (recording) {
      if (supportsMediaRecorder()) {
        mediaRecorderRef.current?.stop()
      } else {
        await stopWebAudio()
      }
    } else {
      await startRecording()
    }
  }, [recording, startRecording, stopWebAudio])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const label = isIOS() ? 'Запись через микрофон' : 'Удерживайте для записи'

  return (
    <button
      type="button"
      onClick={isIOS() ? toggleRecording : undefined}
      onMouseDown={!isIOS() ? startRecording : undefined}
      onMouseUp={!isIOS() ? stopRecording : undefined}
      onMouseLeave={!isIOS() ? stopRecording : undefined}
      onTouchStart={!isIOS() ? startRecording : undefined}
      onTouchEnd={!isIOS() ? stopRecording : undefined}
      className={`relative px-3 py-2 rounded-lg select-none ${
        recording ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      title={label}
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
