import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existingUser = await query(
      'SELECT user_id FROM "users" WHERE email = $1',
      [email]
    )
    const existingCount = existingUser.rowCount ?? 0
    if (existingCount > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    let initialBalance = 0
    if (role === 'Buyer') {
      initialBalance = 2000
    }

    const insertUser = await query(
      `INSERT INTO "users" (name, email, password_hash, balance)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id`,
      [name, email, hashedPassword, initialBalance]
    )
    const newUserId = insertUser.rows[0].user_id

    const roleLookup = await query(
      'SELECT role_id FROM "roles" WHERE role_name = $1',
      [role]
    )
    const roleCount = roleLookup.rowCount ?? 0
    if (roleCount === 0) {
      return NextResponse.json(
        { error: `Role "${role}" not found` },
        { status: 400 }
      )
    }
    const roleId = roleLookup.rows[0].role_id

    await query(
      'INSERT INTO "user_roles" (user_id, role_id) VALUES ($1, $2)',
      [newUserId, roleId]
    )

    return NextResponse.json({ message: 'Signup successful' })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
