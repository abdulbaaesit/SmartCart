import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get('x-user-id'))
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await query(
    `
    SELECT
      o.order_id,
      o.order_date,
      o.status,
      o.total_amount,
      o.shipping_address,

      oi.order_item_id,
      oi.product_id,
      oi.quantity,
      oi.price            AS item_price,

      p.name              AS product_name,
      pi.image_url        AS image,

      -- If this order_item has been resold, pr.product_id will be non-null
      pr.product_id       AS listing_id,
      (pr.product_id IS NOT NULL) AS up_for_sale,

      -- If ANY other user has bought that resale listing, it's sold
      EXISTS(
        SELECT 1
          FROM order_items oi2
          JOIN orders o2 ON oi2.order_id = o2.order_id
         WHERE oi2.product_id = pr.product_id
           AND o2.user_id <> $1
      ) AS sold

    FROM orders o
    JOIN order_items oi
      ON oi.order_id = o.order_id
    JOIN products p
      ON p.product_id = oi.product_id
    LEFT JOIN LATERAL (
      SELECT image_url
        FROM product_images
       WHERE product_id = p.product_id
       ORDER BY image_id
       LIMIT 1
    ) pi ON true
    LEFT JOIN products pr
      ON pr.original_order_item_id = oi.order_item_id
     AND pr.seller_id = $1

    WHERE o.user_id = $1
    ORDER BY o.order_date DESC, oi.order_item_id
    `,
    [userId]
  )

  const ordersMap: Record<number, any> = {}
  for (const row of res.rows) {
    const {
      order_id,
      order_date,
      status,
      total_amount,
      shipping_address,
      order_item_id,
      product_id,
      quantity,
      item_price,
      product_name,
      image,
      listing_id,
      up_for_sale,
      sold,
    } = row

    if (!ordersMap[order_id]) {
      ordersMap[order_id] = {
        order_id,
        order_date,
        status,
        total_amount,
        shipping_address,
        items: [],
      }
    }

    ordersMap[order_id].items.push({
      order_item_id,
      product_id,
      quantity,
      price: item_price,
      name: product_name,
      image,
      listing_id,                
      up_for_sale: Boolean(up_for_sale),
      sold: Boolean(sold),
    })
  }

  const orders = Object.values(ordersMap)
  return NextResponse.json({ orders })
}
