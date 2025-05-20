'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useUserContext } from '@/context/UserContext'
import { FaCalendarAlt, FaTag, FaTrash } from 'react-icons/fa'

type OrderItem = {
  order_item_id: number
  product_id: number
  name: string
  image: string
  quantity: number
  price: number
  listing_id: number | null
  up_for_sale: boolean
  sold: boolean
}

type Order = {
  order_id: number
  order_date: string
  status: string
  total_amount: number
  shipping_address: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const { user } = useUserContext()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/orders', {
      headers: { 'x-user-id': String(user!.user_id) },
    })
    if (res.ok) {
      const { orders } = await res.json()
      setOrders(orders)
    }
    setLoading(false)
  }

  const handleSell = (item: OrderItem) => {
    router.push(`/resell/add-product?orderItemId=${item.order_item_id}`)
  }

  const handleRemoveListing = async (item: OrderItem) => {
    if (!confirm('Remove this listing?')) return
    await fetch(`/api/resell/remove-product?productId=${item.listing_id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': String(user!.user_id) },
    })
    fetchOrders()
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center">
          Loading your orders…
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">My Orders</h1>

        {orders.length === 0 ? (
          <p className="text-gray-600">You have no orders yet.</p>
        ) : (
          orders.map(order => (
            <div
              key={order.order_id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FaCalendarAlt className="text-gray-500" />
                  <span className="font-semibold">
                    Order #{order.order_id}
                  </span>
                  <span className="text-gray-500">
                    – {new Date(order.order_date).toLocaleString()}
                  </span>
                </div>
                <span className="text-blue-600 font-medium">
                  {order.status}
                </span>
              </div>

              <div className="px-6 py-4 space-y-4">
                {order.items.map(item => (
                  <div
                    key={item.order_item_id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="font-semibold">
                        ${(item.price * item.quantity)}
                      </span>

                      {!item.up_for_sale ? (
                        <button
                          onClick={() => handleSell(item)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                        >
                          <FaTag /> <span>Sell My Item</span>
                        </button>
                      ) : item.sold ? (
                        <button
                          disabled
                          className="px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed"
                        >
                          Sold
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveListing(item)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
                        >
                          <FaTrash /> <span>Remove Listing</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t flex justify-end items-center space-x-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold">
                  ${order.total_amount}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </>
  )
}
