import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { supabase } from "@/lib/supabaseClient"

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"))
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const orderItemId = Number(searchParams.get("orderItemId"))
  if (!orderItemId) {
    return NextResponse.json(
      { error: "orderItemId is required" },
      { status: 400 }
    )
  }

  const sql = `
    SELECT
      oi.order_item_id      AS "orderItemId",
      oi.product_id         AS "productId",
      p.name                AS "productName",
      oi.price              AS "purchasePrice",
      p.category_id         AS "categoryId"
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE oi.order_item_id = $1
      AND o.user_id = $2
  `
  const result = await query(sql, [orderItemId, userId])
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 })
  }
  return NextResponse.json(result.rows[0])
}

export async function POST(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id"))
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const orderItemId = Number(formData.get("orderItemId") as string)
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null
    const price = parseFloat(formData.get("price") as string)
    const quantity = 1
    const catRaw = formData.get("category_id") as string | null
    if (!catRaw) {
      return NextResponse.json({ error: "Missing category_id" }, { status: 400 })
    }
    const category_id = parseInt(catRaw, 10)
    const tagsStr = formData.get("tags") as string | null
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()) : null
    const condition = "used"
    const insertProduct = `
      INSERT INTO products
        (name, description, price, stock_qty, condition,
         category_id, tags, seller_id, original_order_item_id)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        product_id, name, description, price, stock_qty AS quantity,
        category_id, tags, condition, original_order_item_id
    `
    const prodRes = await query(insertProduct, [
      name,
      description,
      price,
      quantity,
      condition,
      category_id,
      tags,
      userId,
      orderItemId,
    ])
    if (prodRes.rowCount === 0) {
      throw new Error("Failed to insert resell product")
    }
    const newProd = prodRes.rows[0]
    const newPid = newProd.product_id

    const imageFiles = formData.getAll("images") as File[]
    for (const file of imageFiles) {
      if (!(file instanceof File)) continue

      const buffer = Buffer.from(await file.arrayBuffer())
      const key = `${newPid}/${Date.now()}-${file.name}`

      const { error: upErr } = await supabase
        .storage
        .from("product-images")
        .upload(key, buffer, { contentType: file.type })
      if (upErr) throw upErr

      const { data } = supabase
        .storage
        .from("product-images")
        .getPublicUrl(key)
      const publicUrl = data.publicUrl
      if (!publicUrl) throw new Error("Could not retrieve public URL")

      await query(
        `INSERT INTO product_images (product_id, image_url)
           VALUES ($1,$2)`,
        [newPid, publicUrl]
      )
    }

    return NextResponse.json({ product: newProd })
  } catch (err: any) {
    console.error("🛑 resell/add-product error:", err.message || err)
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
