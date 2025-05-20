'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useUserContext } from '@/context/UserContext'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, cart, setCart } = useUserContext()

  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetch(`/api/users/${user.user_id}/balance`, {
      headers: { 'x-user-id': String(user.user_id) }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load balance')
        return res.json()
      })
      .then(data => setBalance(data.balance))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, router])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const remaining = balance - subtotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!firstName || !lastName || !address || !city || !postal || !phone) {
      setError('All fields are required.')
      return
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user!.user_id),
        },
        body: JSON.stringify({
          items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            size:   i.size
          })),
          shipping: { firstName, lastName, address, city, postal, phone }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')

      setCart([])

      const params = new URLSearchParams({
        shipping:   JSON.stringify({ firstName, lastName, address, city, postal, phone }),
        items:      JSON.stringify(cart),
        newBal:     String(data.newBalance)
      }).toString()

      router.push(`/checkout/confirmed?${params}`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center">Loading…</div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Shipping Details</h2>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={postal}
                onChange={e => setPostal(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={cart.length === 0 || subtotal > balance}
              className={`mt-4 w-full py-3 text-white rounded ${
                cart.length === 0 || subtotal > balance
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Confirm & Pay
            </button>
          </form>
        </div>

        <div className="lg:w-1/3 bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          {subtotal === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
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
                ))}
              </div>
              <div className="mb-4 flex justify-between font-bold">
                <span>Subtotal:</span>
                <span>${subtotal}</span>
              </div>
              <div className="mb-4 flex justify-between">
                <span>Your Balance:</span>
                <span>${balance}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Remaining:</span>
                <span className={remaining < 0 ? 'text-red-500' : ''}>
                  ${remaining}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
