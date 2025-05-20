import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { supabase } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const price = parseFloat(formData.get('price') as string)
    const quantity = parseInt(formData.get('quantity') as string, 10)
    const category_id = parseInt(formData.get('category_id') as string, 10)
    const tagsRaw = formData.get('tags') as string | null
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : null
    const seller_id = parseInt(formData.get('seller_id') as string, 10)
    const sizesRaw = formData.get('sizes') as string | null
    const sizes = sizesRaw
      ? JSON.stringify(JSON.parse(sizesRaw))
      : null
    const condition = 'new'

    const insertProduct = `
      INSERT INTO products 
        (name, description, price, stock_qty, condition, category_id, tags, seller_id, sizes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING product_id, name, description, price, stock_qty AS quantity,
                category_id, tags, sizes, condition, created_at, updated_at
    `
    const { rows } = await query(insertProduct, [
      name, description, price, quantity, condition,
      category_id, tags, seller_id, sizes,
    ])
    const newProduct = rows[0]
    const product_id = newProduct.product_id

    const imageFiles = formData.getAll('images') as File[]
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = `${product_id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase
        .storage
        .from('product-images')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false
        })
      if (upErr) throw upErr

      const { data } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(filename)

      const publicUrl = data.publicUrl
      if (!publicUrl) throw new Error('Could not get public URL')

      await query(
        `INSERT INTO product_images (product_id, image_url)
         VALUES ($1, $2)`,
        [product_id, publicUrl]
      )
    }

    return NextResponse.json({
      message: 'Product added successfully',
      product: newProduct
    })
  } catch (err: any) {
    console.error('Add product error', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
