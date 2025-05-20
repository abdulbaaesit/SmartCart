'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { FaStar, FaRegStar } from 'react-icons/fa'

type Product = {
  id: number
  name: string
  image: string
  price: number
  rating: number
  reviews_count: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParam = searchParams.get('query') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const url = queryParam
          ? `/api/products?query=${encodeURIComponent(queryParam)}&page=${pageParam}`
          : `/api/products?page=${pageParam}`
        const res = await fetch(url)
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load products')
        }
        setProducts(json.products)
        setTotalCount(json.totalCount)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [queryParam, pageParam])

  const totalPages = Math.ceil(totalCount / 8)

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) =>
      i < Math.floor(rating)
        ? <FaStar key={i} className="text-yellow-500" />
        : <FaRegStar key={i} className="text-yellow-500" />
    )

  const goTo = (p: number) => {
    const base = queryParam
      ? `/search?query=${encodeURIComponent(queryParam)}&page=${p}`
      : `/search?page=${p}`
    router.push(base)
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-screen-xl py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">
          {queryParam ? `Results for "${queryParam}"` : 'All Products'}
        </h1>
        {loading && <p className="text-center">Loading…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map(p => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="cursor-pointer border rounded-lg p-4 shadow hover:shadow-md flex flex-col"
            >
              <img
                src={p.image || 'https://via.placeholder.com/300x400?text=No+Image'}
                alt={p.name}
                className="w-full h-64 object-cover rounded mb-4"
              />
              <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
              <div className="flex items-center space-x-1 mb-2">
                {renderStars(p.rating)}
                <span className="text-sm text-gray-500">({p.reviews_count})</span>
              </div>
              <p className="text-xl font-bold mt-auto">${p.price}</p>
            </Link>
          ))}
        </div>
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => goTo(pageParam - 1)}
            disabled={pageParam <= 1}
            className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => goTo(num)}
              className={`px-3 py-1 border rounded ${
                num === pageParam ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => goTo(pageParam + 1)}
            disabled={pageParam >= totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <Footer />
    </>
  )
}