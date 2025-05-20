import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getCartId(userId: number) {
  const res = await query(
    `SELECT cart_id FROM Carts WHERE user_id = $1`,
    [userId]
  )
  if (!res.rows.length) throw new Error('Cart not found')
  return res.rows[0].cart_id
}

export async function PATCH(req: NextRequest, { params }: any) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  }

  const { quantity } = await req.json()
  if (typeof quantity !== 'number' || quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  }

  const cartId = await getCartId(+userId)

  await query(
    `UPDATE Cart_Items 
       SET quantity = $1 
     WHERE cart_id = $2 AND product_id = $3`,
    [quantity, cartId, +params.productId]
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: any) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  }

  const cartId = await getCartId(+userId)

  await query(
    `DELETE FROM Cart_Items 
     WHERE cart_id = $1 
       AND product_id = $2`,
    [cartId, +params.productId]
  )

  return NextResponse.json({ success: true })
}
