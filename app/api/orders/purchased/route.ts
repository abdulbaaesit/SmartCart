import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get('x-user-id'))
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const url = new URL(req.url)
  const productId = Number(url.searchParams.get('productId'))
  if (!productId) {
    return NextResponse.json(
      { error: 'Missing productId' },
      { status: 400 }
    )
  }

  const res = await query(
    `
    SELECT 1
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
     WHERE o.user_id    = $1
       AND oi.product_id = $2
     LIMIT 1
    `,
    [userId, productId]
  )

  const count = res.rowCount ?? 0
  return NextResponse.json({
    hasPurchased: count > 0
  })
}
