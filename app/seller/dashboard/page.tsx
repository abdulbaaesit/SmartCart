'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { Card, CardHeader, CardContent } from '@/app/components/card'
import { Spinner } from '@/app/components/spinner'

type DailySale = { day: string; sales: number }
type TopProduct = { id: number; name: string; sold: number }
type LowStock = { id: number; name: string; stock: number }

export default function SellerDashboard() {
  const router = useRouter()
  const { user } = useUserContext()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalOrders,   setTotalOrders]   = useState(0)
  const [totalRevenue,  setTotalRevenue]  = useState(0)
  const [dailySales,    setDailySales]    = useState<DailySale[]>([])
  const [topProducts,   setTopProducts]   = useState<TopProduct[]>([])
  const [lowStock,      setLowStock]      = useState<LowStock[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    async function fetchDashboard() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/seller/dashboard', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(user!.user_id),
          }
        })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load data')

        setTotalProducts(json.totalProducts)
        setTotalOrders(json.totalOrders)
        setTotalRevenue(json.totalRevenue)
        setDailySales(json.dailySales)
        setTopProducts(json.topProducts)
        setLowStock(json.lowStock)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [user, router])

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Seller Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>Total Products</CardHeader>
          <CardContent className="text-3xl">{totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader>Total Orders</CardHeader>
          <CardContent className="text-3xl">{totalOrders}</CardContent>
        </Card>
        <Card>
          <CardHeader>Total Revenue</CardHeader>
          <CardContent className="text-3xl">${totalRevenue.toFixed(2)}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>Daily Sales (Last 7 Days)</CardHeader>
          <CardContent style={{ height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={dailySales}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#3182ce" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Top 5 Products Sold</CardHeader>
          <CardContent style={{ height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={topProducts}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60}/>
                <YAxis />
                <Tooltip />
                <Bar dataKey="sold" fill="#48bb78" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>Low Stock Alerts (&lt; 5 units)</CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p>No low-stock items.</p>
          ) : (
            <ul className="list-disc pl-5">
              {lowStock.map(item => (
                <li key={item.id}>
                  {item.name} — {item.stock} left
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
