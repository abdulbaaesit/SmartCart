import { Pool } from 'pg'

declare global {
  var __pool__: Pool | undefined
}

const pool = global.__pool__ ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
})

if (process.env.NODE_ENV !== 'production') {
  global.__pool__ = pool
}

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params)
  return res
}
