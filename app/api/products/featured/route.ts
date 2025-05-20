import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sql = `
      WITH distinctProducts AS (
        SELECT DISTINCT ON (p.category_id)
          p.product_id   AS id,
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
        ORDER BY p.category_id, random()
      ),
      distinctCount AS (
        SELECT COUNT(*) AS cnt FROM distinctProducts
      ),
      additionalProducts AS (
        SELECT
          p.product_id   AS id,
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
        WHERE p.product_id NOT IN (SELECT id FROM distinctProducts)
        ORDER BY random()
        LIMIT (8 - (SELECT cnt FROM distinctCount))
      )
      SELECT * FROM distinctProducts
      UNION ALL
      SELECT * FROM additionalProducts;
    `;
    const result = await query(sql);
    return NextResponse.json({ products: result.rows });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
