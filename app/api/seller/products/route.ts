import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('user_id');
    if (!sellerId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    const productsResult = await query(
      `
      SELECT 
        p.product_id, 
        p.name, 
        p.price, 
        p.stock_qty AS quantity, 
        p.condition,
        c.name AS category, 
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
      WHERE p.seller_id = $1
      `,
      [sellerId]
    );

    return NextResponse.json({ products: productsResult.rows });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
