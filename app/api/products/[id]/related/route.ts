import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: any
) {
  try {
    const productId = params.id

    const relatedResult = await query(
      `
      SELECT 
        p.product_id AS id,
        p.name, 
        p.price, 
        (
          SELECT image_url 
          FROM product_images 
          WHERE product_id = p.product_id 
          LIMIT 1
        ) AS image
      FROM products p
      WHERE p.category_id = (
          SELECT category_id 
          FROM products 
          WHERE product_id = $1
        )
        AND p.product_id <> $1
      ORDER BY random()
      LIMIT 4
      `,
      [productId]
    )

    return NextResponse.json({ products: relatedResult.rows || [] })
  } catch (err) {
    console.error('Error in GET /api/products/[id]/related:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
