'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useUserContext } from '@/context/UserContext'
import { FaTrash, FaShoppingCart } from 'react-icons/fa'

type WishlistItem = {
  productId: number
  name: string
  price: number
  image: string
}

type ProductDetail = {
  quantity: number
  sizes?: { size: string; stock: number }[]
}

type WishlistRow = WishlistItem & {
  availableStock: number
  defaultSize: string | null
}

export default function WishlistPage() {
  const router = useRouter()
  const { user, setWishlist } = useUserContext()
  const [items, setItems] = useState<WishlistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWishlist = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wishlist', {
        headers: { 'x-user-id': String(user.user_id) },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`GET /api/wishlist failed (${res.status})`)
      const { items: basic }: { items: WishlistItem[] } = await res.json()

      setWishlist(basic.map(wi => wi.productId))

      const detailed = await Promise.all(
        basic.map(async wi => {
          const pr = await fetch(`/api/products/${wi.productId}`)
          if (!pr.ok) throw new Error(`Failed loading product ${wi.productId}`)
          const { product }: { product: ProductDetail } = await pr.json()

          let availableStock = product.quantity
          let defaultSize: string | null = null

          if (product.sizes && product.sizes.length) {
            const first = product.sizes[0]
            availableStock = first.stock
            defaultSize = first.size
          }

          return {
            ...wi,
            availableStock,
            defaultSize,
          }
        })
      )

      setItems(detailed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return router.push('/login')
    loadWishlist()
  }, [user, router])

  const deleteItem = async (productId: number) => {
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': String(user!.user_id) },
      })
      if (!res.ok) throw new Error(`DELETE /api/wishlist/${productId} failed`)
      await loadWishlist()
    } catch { }
  }

  const moveToCart = async (item: WishlistRow) => {
    if (item.availableStock === 0) return
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user!.user_id),
        },
        body: JSON.stringify({
          productId: item.productId,
          size: item.defaultSize ?? '',
          quantity: 1,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to move to cart')
      }
      await deleteItem(item.productId)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center">
          Loading your wishlist…
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center text-red-600">
          Error: {error}
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Your Wishlist</h2>

        {items.length > 0 ? (
          items.map(item => (
            <div
              key={item.productId}
              className="flex items-center justify-between border-b py-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">${item.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => deleteItem(item.productId)}
                  className="p-2 hover:bg-gray-100 rounded text-red-500"
                >
                  <FaTrash />
                </button>

                {item.availableStock > 0 ? (
                  <button
                    onClick={() => moveToCart(item)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FaShoppingCart className="inline mr-2" />
                    Move to Cart
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 mt-6">
            Your wishlist is empty.
          </p>
        )}
      </div>
      <Footer />
    </>
  )
}
