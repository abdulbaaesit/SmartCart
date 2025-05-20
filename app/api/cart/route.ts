import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function getCart(userId: number) {
  const res = await query(
    `
    SELECT
      ci.product_id      AS "productId",
      ci.quantity        AS "quantity",
      ci.size            AS "size",
      p.name             AS "name",
      p.price            AS "price",
      pi.image_url       AS "image"
    FROM cart_items ci
    JOIN carts c
      ON ci.cart_id = c.cart_id
    JOIN products p
      ON p.product_id = ci.product_id
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images
      WHERE product_id = p.product_id
      ORDER BY image_id
      LIMIT 1
    ) pi ON true
    WHERE c.user_id = $1
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
  const items = await getCart(userId);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { productId, size, quantity } = await req.json();

  await query(
    `
    INSERT INTO carts(user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING
    `,
    [userId]
  );

  await query(
    `
    INSERT INTO cart_items(cart_id, product_id, size, quantity)
    VALUES (
      (SELECT cart_id FROM carts WHERE user_id = $1),
      $2,
      $3,
      $4
    )
    ON CONFLICT (cart_id, product_id, size)
    DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `,
    [userId, productId, size || '', quantity]
  );

  const items = await getCart(userId);
  return NextResponse.json({ items });
}

export async function PUT(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { productId, size, quantity } = await req.json();

  await query(
    `
    UPDATE cart_items
    SET quantity = $3
    WHERE cart_id = (SELECT cart_id FROM carts WHERE user_id = $1)
      AND product_id = $2
      AND size IS NOT DISTINCT FROM $4
    `,
    [userId, productId, quantity, size || '']
  );

  const items = await getCart(userId);
  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { productId, size } = await req.json();

  await query(
    `
    DELETE FROM cart_items
    WHERE cart_id = (SELECT cart_id FROM carts WHERE user_id = $1)
      AND product_id = $2
      AND size IS NOT DISTINCT FROM $3
    `,
    [userId, productId, size || '']
  );

  const items = await getCart(userId);
  return NextResponse.json({ items });
}
