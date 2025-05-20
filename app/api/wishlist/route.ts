import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function getWishlist(userId: number) {
  const res = await query(
    `
    SELECT
      wi.product_id    AS "productId",
      p.name           AS "name",
      p.price          AS "price",
      pi.image_url     AS "image"
    FROM wishlist_items wi
    JOIN products p
      ON p.product_id = wi.product_id
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images
      WHERE product_id = p.product_id
      ORDER BY image_id
      LIMIT 1
    ) pi ON true
    WHERE wi.user_id = $1
    ORDER BY wi.added_at DESC
    `,
    [userId]
  );
  return res.rows;
}

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getWishlist(userId);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { productId } = await req.json();

  if (typeof productId !== "number") {
    return NextResponse.json(
      { error: "Invalid or missing productId" },
      { status: 400 }
    );
  }

  await query(
    `
    INSERT INTO wishlist_items (user_id, product_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, product_id) DO NOTHING
    `,
    [userId, productId]
  );

  const items = await getWishlist(userId);
  return NextResponse.json({ items });
}
