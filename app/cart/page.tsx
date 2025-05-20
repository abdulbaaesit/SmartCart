'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useUserContext } from '@/context/UserContext'
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa'

type CartItem = {
  productId: number
  name: string
  price: number
  image: string
  quantity: number
  size: string | null
}

export default function CartPage() {
  const router = useRouter()
  const { user, setCart: setCartContext } = useUserContext()
  const [cart, setCartState] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCart = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'x-user-id': String(user.user_id),
        },
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`GET /api/cart failed (${res.status})`)
      }
      const { items } = await res.json()
      setCartState(items || [])
      setCartContext(items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return router.push('/login')
    fetchCart()
  }, [user])

  const updateQuantity = async (item: CartItem, newQty: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user!.user_id),
        },
        cache: 'no-store',
        body: JSON.stringify({
          productId: item.productId,
          size: item.size,
          quantity: newQty,
        }),
      })
      if (!res.ok) {
        throw new Error(`PUT /api/cart failed (${res.status})`)
      }
      await fetchCart()
    } catch (err) {
    }
  }

  const removeItem = async (item: CartItem) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user!.user_id),
        },
        cache: 'no-store',
        body: JSON.stringify({
          productId: item.productId,
          size: item.size,
        }),
      })
      if (!res.ok) {
        throw new Error(`DELETE /api/cart failed (${res.status})`)
      }
      await fetchCart()
    } catch (err) {
    }
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const handleCheckout = () => router.push('/checkout')

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center">
          Loading your cart…
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
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white rounded-lg p-6 shadow space-y-6">
          <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
          {cart.length > 0 ? (
            cart.map(item => (
              <div
                key={`${item.productId}-${item.size ?? 'none'}`}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.size && (
                      <p className="text-sm text-gray-500">
                        Size: {item.size}
                      </p>
                    )}
                    <p className="text-gray-600">${item.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item, Math.max(item.quantity - 1, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FaMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FaPlus />
                  </button>
                  <button
                    onClick={() => removeItem(item)}
                    className="p-1 hover:bg-gray-100 rounded text-red-500"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 mt-6">
              Your cart is empty.
            </p>
          )}
        </div>

        <div className="lg:w-1/3 bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.length > 0 ? (
              cart.map(item => (
                <div
                  key={`sum-${item.productId}-${item.size ?? 'none'}`}
                  className="flex justify-between"
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity}
                      {item.size ? ` • Size: ${item.size}` : ''}
                    </div>
                  </div>
                  <div className="font-semibold">
                    ${item.price * item.quantity}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">Your cart is empty.</div>
            )}
          </div>
          <div className="flex justify-between font-bold text-lg mb-6">
            <span>Total</span>
            <span>${subtotal}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded text-white ${cart.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            Go to Checkout →
          </button>
        </div>
      </div>
      <Footer />
    </>
  )
}
