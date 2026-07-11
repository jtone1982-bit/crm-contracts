import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5433),
  database: process.env.POSTGRES_DB || 'crm',
  user: process.env.POSTGRES_USER || 'crm',
  password: process.env.POSTGRES_PASSWORD || 'crm_password_2026',
})

export { pool }

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}
