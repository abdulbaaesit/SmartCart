import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const sellerIdHeader = req.headers.get('x-user-id')
  const sellerId = sellerIdHeader ? Number(sellerIdHeader) : null
  if (!sellerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const prodRes = await query(
      `SELECT COUNT(*) AS total_products
         FROM products
        WHERE seller_id = $1`,
      [sellerId]
    )
    const totalProducts = Number(prodRes.rows[0].total_products)

    const ordersRes = await query(
      `SELECT COUNT(DISTINCT o.order_id) AS total_orders
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN products p ON oi.product_id = p.product_id
        WHERE p.seller_id = $1`,
      [sellerId]
    )
    const totalOrders = Number(ordersRes.rows[0].total_orders)

    const revenueRes = await query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity),0) AS total_revenue
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
        WHERE p.seller_id = $1`,
      [sellerId]
    )
    const totalRevenue = Number(revenueRes.rows[0].total_revenue)

    const dailyRes = await query(
      `SELECT
         to_char(o.order_date, 'YYYY-MM-DD') AS day,
         COALESCE(SUM(oi.quantity),0)::int AS sales_count
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
      WHERE p.seller_id = $1
        AND o.order_date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY day
      ORDER BY day`,
      [sellerId]
    )
    // Explicitly type 'r' to avoid implicit-any
    const dailySales = dailyRes.rows.map((r: any) => ({
      day: r.day,
      sales: Number(r.sales_count),
    }))

    const topRes = await query(
      `SELECT
         p.product_id,
         p.name,
         COALESCE(SUM(oi.quantity),0)::int AS sold_qty
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
      WHERE p.seller_id = $1
      GROUP BY p.product_id, p.name
      ORDER BY sold_qty DESC
      LIMIT 5`,
      [sellerId]
    )
    const topProducts = topRes.rows.map((r: any) => ({
      id: r.product_id,
      name: r.name,
      sold: Number(r.sold_qty),
    }))

    const lowRes = await query(
      `SELECT product_id, name, stock_qty
         FROM products
        WHERE seller_id = $1
          AND stock_qty < 5
        ORDER BY stock_qty ASC`,
      [sellerId]
    )
    const lowStock = lowRes.rows.map((r: any) => ({
      id: r.product_id,
      name: r.name,
      stock: Number(r.stock_qty),
    }))

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      dailySales,
      topProducts,
      lowStock,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
