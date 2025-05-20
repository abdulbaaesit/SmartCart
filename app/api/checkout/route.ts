import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import nodemailer from 'nodemailer'

function buildOrderConfirmationEmail(
  buyerName: string,
  shipping: {
    firstName: string
    lastName: string
    address: string
    city: string
    postal: string
    phone: string
  },
  items: Array<{
    name: string
    size?: string | null
    quantity: number
    price: number
  }>,
  newBalance: number
) {
  const itemsRows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">
        ${it.name}${it.size ? ` (${it.size})` : ''}
      </td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">
        ${it.quantity}
      </td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">
        \$${it.price * it.quantity}
      </td>
    </tr>
  `
    )
    .join('')

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
    <h2 style="text-align:center;color:#0052cc">
      Thank you for your order, ${buyerName}!
    </h2>
    <p>We've received your order and will begin processing it right away. Below is a summary:</p>
    <h3>Shipping Information</h3>
    <p>
      ${shipping.firstName} ${shipping.lastName}<br/>
      ${shipping.address}, ${shipping.city} ${shipping.postal}<br/>
      Phone: ${shipping.phone}
    </p>
    <h3>Order Details</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th align="left" style="padding:8px;border:1px solid #ddd;background:#f5f5f5">Item</th>
          <th align="center" style="padding:8px;border:1px solid #ddd;background:#f5f5f5">Qty</th>
          <th align="right" style="padding:8px;border:1px solid #ddd;background:#f5f5f5">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">
            Your new balance:
          </td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">
            \$${newBalance}
          </td>
        </tr>
      </tfoot>
    </table>
    <p style="text-align:center;margin-top:24px">
      <a href="http://localhost:3000/" style="background:#0052cc;color:white;padding:12px 24px;border-radius:4px;text-decoration:none">
        Continue Shopping
      </a>
    </p>
    <p style="font-size:12px;color:#888;text-align:center;margin-top:16px">
      If you have any questions, reply to this email or contact support@smartcart.com.
    </p>
  </div>
  `
}

export async function POST(req: NextRequest) {
  const buyerId = Number(req.headers.get('x-user-id'))
  if (!buyerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { shipping, items } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const needed = ['firstName', 'lastName', 'address', 'city', 'postal', 'phone']
  for (let f of needed) {
    if (!shipping?.[f]) {
      return NextResponse.json({ error: `Missing shipping.${f}` }, { status: 400 })
    }
  }

  const ids = items.map((i: any) => i.productId)
  const prodRes = await query(
    `SELECT product_id, name, price, seller_id
         FROM products
        WHERE product_id = ANY($1)`,
    [ids]
  )

  const productMap = new Map<number, { name: string; price: number; seller_id: number }>()
  for (const r of prodRes.rows) {
    productMap.set(r.product_id, {
      name: r.name,
      price: +r.price,
      seller_id: r.seller_id,
    })
  }

  let total = 0
  const sellerTotals = new Map<number, number>()
  for (const it of items) {
    const meta = productMap.get(it.productId)
    if (!meta) {
      return NextResponse.json({ error: `Invalid product ${it.productId}` }, { status: 400 })
    }
    const line = meta.price * it.quantity
    total += line
    sellerTotals.set(meta.seller_id, (sellerTotals.get(meta.seller_id) || 0) + line)
  }

  try {
    await query('BEGIN')
    const balRes = await query(
      `SELECT balance FROM users WHERE user_id=$1 FOR UPDATE`,
      [buyerId]
    )
    if (!balRes.rows.length || +balRes.rows[0].balance < total) {
      await query('ROLLBACK')
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    await query(`UPDATE users SET balance=balance-$1 WHERE user_id=$2`, [total, buyerId])

    // ← Here: convert Map to array for iteration
    for (const [sid, amt] of Array.from(sellerTotals)) {
      await query(`UPDATE users SET balance=balance+$1 WHERE user_id=$2`, [amt, sid])
    }

    const orderRes = await query(
      `INSERT INTO orders
         (user_id,status,total_amount,shipping_address,payment_status)
       VALUES ($1,'PLACED',$2,$3,'PAID')
       RETURNING order_id, order_date`,
      [buyerId, total, `${shipping.address}, ${shipping.city} ${shipping.postal}`]
    )
    const orderId = orderRes.rows[0].order_id
    const orderDate = orderRes.rows[0].order_date

    for (const it of items) {
      const { price } = productMap.get(it.productId)!

      await query(
        `INSERT INTO order_items
           (order_id,product_id,quantity,price)
         VALUES ($1,$2,$3,$4)`,
        [orderId, it.productId, it.quantity, price]
      )

      if (it.size) {
        const szRes = await query(
          `SELECT sizes, stock_qty FROM products WHERE product_id=$1 FOR UPDATE`,
          [it.productId]
        )
        if (szRes.rows.length) {
          const { sizes, stock_qty } = szRes.rows[0]
          const newSizes = (sizes as any[]).map((sObj) =>
            sObj.size === it.size ? { ...sObj, stock: sObj.stock - it.quantity } : sObj
          )
          await query(
            `UPDATE products
               SET sizes = $1::json,
                   stock_qty = $2
             WHERE product_id = $3`,
            [JSON.stringify(newSizes), stock_qty - it.quantity, it.productId]
          )
        }
      } else {
        await query(
          `UPDATE products
             SET stock_qty = stock_qty - $1
           WHERE product_id = $2`,
          [it.quantity, it.productId]
        )
      }
    }

    await query(
      `DELETE FROM cart_items
       WHERE cart_id = (SELECT cart_id FROM carts WHERE user_id = $1)`,
      [buyerId]
    )

    await query('COMMIT')

    const newBalRes = await query(`SELECT balance FROM users WHERE user_id=$1`, [buyerId])
    const newBalance = newBalRes.rows[0]?.balance ?? 0

    const userRes = await query(`SELECT email FROM users WHERE user_id=$1`, [buyerId])
    const email: string = userRes.rows[0].email

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_PASS!,
      },
    })

    const emailItems = items.map((it) => {
      const meta = productMap.get(it.productId)!
      return {
        name: meta.name,
        size: it.size,
        quantity: it.quantity,
        price: meta.price,
      }
    })

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your Order Confirmation',
      html: buildOrderConfirmationEmail(
        `${shipping.firstName} ${shipping.lastName}`,
        shipping,
        emailItems,
        newBalance
      ),
    })

    return NextResponse.json({
      success: true,
      orderId,
      orderDate,
      newBalance,
    })
  } catch (err: any) {
    await query('ROLLBACK').catch(() => {})
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
