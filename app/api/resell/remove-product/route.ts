import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = Number(searchParams.get("productId"));
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const deleteRes = await query(
    `DELETE FROM products 
     WHERE product_id = $1 
       AND seller_id = $2 
       AND original_order_item_id IS NOT NULL`,
    [productId, userId]
  );
  if (deleteRes.rowCount === 0) {
    return NextResponse.json({ error: "Listing not found or not yours" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
