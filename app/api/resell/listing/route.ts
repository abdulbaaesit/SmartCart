import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  const userId = Number(req.headers.get('x-user-id'))
  if (!userId) return NextResponse.json({ error:'Unauthorized'},{status:401})

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error:'Missing productId'},{status:400})

  await query(
    `DELETE FROM products 
       WHERE product_id = $1 
         AND seller_id = $2 
         AND original_order_item_id IS NOT NULL`,
    [productId, userId]
  )
  return NextResponse.json({ success: true })
}
