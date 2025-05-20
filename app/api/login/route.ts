import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    const userResult = await query(
      `SELECT 
         u.user_id, 
         u.email, 
         u.name, 
         u.password_hash, 
         r.role_name as role
       FROM users u
       JOIN user_roles ur ON u.user_id = ur.user_id
       JOIN roles r ON ur.role_id = r.role_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const row = userResult.rows[0];
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userPayload = {
      user_id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
    };

    const res = NextResponse.json({
      message: 'Login successful',
      user: userPayload,
    });

    res.cookies.set('user_id', String(row.user_id), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
