import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params } : any
) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = Number(params.productId);
  if (isNaN(productId)) {
    return NextResponse.json(
      { error: "Invalid productId parameter" },
      { status: 400 }
    );
  }

  await query(
    `
    DELETE FROM wishlist_items
    WHERE user_id = $1
      AND product_id = $2
    `,
    [userId, productId]
  );

  return NextResponse.json({ success: true });
}
