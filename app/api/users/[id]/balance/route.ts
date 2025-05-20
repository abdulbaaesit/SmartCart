import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: Request,
  { params } : any
) {
  const userId = params.id
  const result = await query(
    `SELECT balance FROM users WHERE user_id = $1`,
    [userId]
  )
  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  const balance = parseFloat(result.rows[0].balance)
  return NextResponse.json({ balance })
}
