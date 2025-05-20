import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params } : any
) {
  try {
    const { id: productId } = params

    const productResult = await query(
      `
      SELECT 
        p.product_id   AS id, 
        p.name, 
        p.description, 
        p.price, 
        p.stock_qty    AS quantity, 
        p.condition,
        c.name         AS category, 
        p.tags,
        p.sizes,
        p.view_count,
        p.click_count,
        p.sold_quantity,
        p.discount_pct,
        p.sale_start,
        p.sale_end,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = $1
      `,
      [productId]
    )

    if (productResult.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = productResult.rows[0]

    const imagesResult = await query(
      `SELECT image_url FROM product_images WHERE product_id = $1`,
      [productId]
    )
    const images = imagesResult.rows.map((row: any) => row.image_url)

    const productWithImages = { ...product, images }

    return NextResponse.json({ product: productWithImages })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
