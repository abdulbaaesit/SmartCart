import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ error: 'Missing product_id parameter' }, { status: 400 });
    }
    await query(`DELETE FROM products WHERE product_id = $1`, [productId]);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
