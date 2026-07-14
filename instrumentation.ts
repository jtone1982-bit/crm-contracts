// instrumentation.ts — runs once when Next.js server starts
// Catches unhandled rejections (e.g. Supabase ECONNRESET) so they don't crash the process

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason: unknown) => {
      const msg = reason instanceof Error ? reason.message : String(reason)
      // Suppress noisy Server Action errors from stale browser tabs
      if (msg.includes('Failed to find Server Action')) {
        return
      }
      console.error('[unhandledRejection]', msg)
    })

    process.on('uncaughtException', (err: Error) => {
      // ECONNRESET from Supabase — log but don't crash
      if (err.message.includes('ECONNRESET') || err.message.includes('fetch failed')) {
        console.error('[uncaughtException] Supabase connection error (non-fatal):', err.message)
        return
      }
      // Server Action errors from stale tabs — suppress
      if (err.message.includes('Failed to find Server Action')) {
        return
      }
      console.error('[uncaughtException]', err.message)
    })
  }
}