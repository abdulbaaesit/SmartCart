import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import nodemailer from 'nodemailer'

function buildPriceDropEmail(
  userName: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
  productId: number
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
      <h2 style="text-align:center;color:#0052cc">Price Drop Alert!</h2>
      <p>Hi ${userName},</p>
      <p>
        Good news: the price of <strong>${productName}</strong> has dropped
        from <del style="color:#888;">$${oldPrice}</del>
        to <strong style="color:#d93025;">$${newPrice}</strong>.
      </p>
      <p style="text-align:center;margin:24px 0">
        <a
          href="${baseUrl}/product/${productId}"
          style="background:#0052cc;color:white;padding:12px 24px;
                 text-decoration:none;border-radius:4px;display:inline-block"
        >
          View Product
        </a>
      </p>
      <p style="font-size:12px;color:#777;">
        You’re receiving this because this item is in your <a href="${baseUrl}/wishlist">wishlist</a>.
      </p>
      <p style="font-size:12px;color:#777;">— The SmartCart Team</p>
    </div>
  `
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      product_id,
      name,
      description,
      price: newPrice,
      quantity,
      category_id,
      tags,
      sizes,
    } = body

    if (!product_id) {
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })
    }

    const oldRes = await query(
      `SELECT price FROM products WHERE product_id = $1`,
      [product_id]
    )
    if (!oldRes.rows.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    const oldPrice = +oldRes.rows[0].price

    const updateQuery = `
      UPDATE products SET
        name = $2,
        description = $3,
        price = $4,
        stock_qty = $5,
        category_id = $6,
        tags = $7,
        sizes = $8::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING product_id, name, description, price, stock_qty AS quantity,
                category_id, tags, sizes, condition, created_at, updated_at
    `
    const values = [
      product_id,
      name,
      description,
      newPrice,
      quantity,
      category_id,
      tags,
      sizes ? JSON.stringify(sizes) : null,
    ]
    const result = await query(updateQuery, values)

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (newPrice < oldPrice) {
      const wlRes = await query(
        `
        SELECT u.user_id AS "id", u.name AS "userName", u.email
        FROM wishlist_items wi
        JOIN users u ON u.user_id = wi.user_id
        WHERE wi.product_id = $1
        `,
        [product_id]
      )

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER!,
          pass: process.env.GMAIL_PASS!,
        },
      })

      for (const { id: userId, userName, email } of wlRes.rows) {
        const html = buildPriceDropEmail(
          userName,
          name,
          oldPrice,
          newPrice,
          product_id
        )

        await transporter
          .sendMail({
            from: process.env.GMAIL_USER!,
            to: email,
            subject: `Price Drop: "${name}" is now $${newPrice}`,
            html,
          })
          .catch((error: any) => {
            console.error(
              `Failed to send price-drop email to user ${userId} (${email}):`,
              error
            )
          })
      }
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: result.rows[0],
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
