import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: any
) {
  try {
    const { id: productId } = await params

    const reviewsResult = await query(
      `
      SELECT 
        r.review_id AS id,
        u.name AS "userName",
        r.rating,
        r.comment,
        to_char(r.review_date, 'Mon DD, YYYY') AS date
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = $1
      ORDER BY r.review_date DESC
      `,
      [productId]
    )

    return NextResponse.json({ reviews: reviewsResult.rows || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: any
) {
  try {
    const { id: productId } = await params

    const { rating, comment, userId } = await req.json()
    if (!rating || !comment || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const insertResult = await query(
      `
      INSERT INTO reviews (product_id, user_id, rating, comment, review_date)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING review_id AS id, rating, comment, to_char(review_date, 'Mon DD, YYYY') AS date
      `,
      [productId, userId, rating, comment]
    )

    const newReview = insertResult.rows[0]

    const userResult = await query(
      `SELECT name FROM users WHERE user_id = $1`,
      [userId]
    )
    const count = userResult.rowCount ?? 0
    if (count > 0) {
      newReview.userName = userResult.rows[0].name
    } else {
      newReview.userName = "Anonymous"
    }

    return NextResponse.json({ review: newReview })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
