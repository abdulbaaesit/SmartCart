import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const searchTerm = searchParams.get('query')
    const pageParam = searchParams.get('page')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    const limit = 8
    const offset = (page - 1) * limit

    if (searchTerm) {
      const pattern = `%${searchTerm}%`
      const countRes = await query(
        `SELECT COUNT(*) AS total_count FROM products WHERE name ILIKE $1 OR tags::text ILIKE $1`,
        [pattern]
      )
      const totalCount = parseInt(countRes.rows[0].total_count, 10)
      const resultRes = await query(
        `
        SELECT
          p.product_id AS id,
          p.name,
          p.price,
          COALESCE((
            SELECT image_url
            FROM product_images
            WHERE product_id = p.product_id
            LIMIT 1
          ), '') AS image,
          COALESCE((
            SELECT ROUND(AVG(r.rating)::numeric,1)
            FROM reviews r
            WHERE r.product_id = p.product_id
          ), 0) AS rating,
          COALESCE((
            SELECT COUNT(*) 
            FROM reviews r
            WHERE r.product_id = p.product_id
          ), 0) AS reviews_count,
          p.stock_qty,
          p.category_id
        FROM products p
        WHERE p.name ILIKE $1 OR p.tags::text ILIKE $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [pattern, limit, offset]
      )
      return NextResponse.json({ products: resultRes.rows, totalCount })
    }

    if (category) {
      const catRes = await query(
        `SELECT category_id FROM categories WHERE name ILIKE $1 LIMIT 1`,
        [category]
      )
      if (catRes.rowCount === 0) {
        return NextResponse.json({ products: [], totalCount: 0 })
      }
      const catId = catRes.rows[0].category_id
      const countRes = await query(
        `SELECT COUNT(*) AS total_count FROM products WHERE category_id = $1`,
        [catId]
      )
      const totalCount = parseInt(countRes.rows[0].total_count, 10)
      const resultRes = await query(
        `
        SELECT
          p.product_id AS id,
          p.name,
          p.price,
          COALESCE((
            SELECT image_url
            FROM product_images
            WHERE product_id = p.product_id
            LIMIT 1
          ), '') AS image,
          COALESCE((
            SELECT ROUND(AVG(r.rating)::numeric,1)
            FROM reviews r
            WHERE r.product_id = p.product_id
          ), 0) AS rating,
          COALESCE((
            SELECT COUNT(*) 
            FROM reviews r
            WHERE r.product_id = p.product_id
          ), 0) AS reviews_count,
          p.stock_qty,
          p.category_id
        FROM products p
        WHERE p.category_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [catId, limit, offset]
      )
      return NextResponse.json({ products: resultRes.rows, totalCount })
    }

    const countRes = await query(
      `SELECT COUNT(*) AS total_count FROM products`,
      []
    )
    const totalCount = parseInt(countRes.rows[0].total_count, 10)
    const resultRes = await query(
      `
      SELECT
        p.product_id AS id,
        p.name,
        p.price,
        COALESCE((
          SELECT image_url
          FROM product_images
          WHERE product_id = p.product_id
          LIMIT 1
        ), '') AS image,
        COALESCE((
          SELECT ROUND(AVG(r.rating)::numeric,1)
          FROM reviews r
          WHERE r.product_id = p.product_id
        ), 0) AS rating,
        COALESCE((
          SELECT COUNT(*) 
          FROM reviews r
          WHERE r.product_id = p.product_id
        ), 0) AS reviews_count,
        p.stock_qty,
        p.category_id
      FROM products p
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    )
    return NextResponse.json({ products: resultRes.rows, totalCount })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
