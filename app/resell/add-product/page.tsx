'use client'


import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useUserContext } from '@/context/UserContext'


type Prefill = {
  orderItemId: number
  productId: number
  productName: string
  purchasePrice: number
  categoryId: number
}

export default function ResellForm() {
  const { user } = useUserContext()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<FileList | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    const oid = searchParams.get('orderItemId')
    if (!oid) {
      setError('No orderItemId provided')
      return
    }
    fetch(`/api/resell/add-product?orderItemId=${oid}`, {
      headers: { 'x-user-id': String(user.user_id) },
    })
      .then(async res => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        return json as Prefill
      })
      .then(data => {
        setPrefill(data)
        setError('')
      })
      .catch(err => {
        setError(err.message)
      })
  }, [user, searchParams, router])

  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prefill) return
    setError('')

    const p = parseFloat(price)
    if (isNaN(p) || p <= 0 || p > prefill.purchasePrice) {
      setError(`Price must be >0 and ≤ ${prefill.purchasePrice}`)
      return
    }
    if (!images || images.length === 0) {
      setError('Please upload at least one image')
      return
    }

    const fd = new FormData()
    fd.append('orderItemId', String(prefill.orderItemId))
    fd.append('name', prefill.productName)
    fd.append('description', description)
    fd.append('price', p.toString())
    fd.append('quantity', '1')
    fd.append('category_id', String(prefill.categoryId))
    fd.append('tags', tags)
    Array.from(images).forEach(file => fd.append('images', file))

    const res = await fetch('/api/resell/add-product', {
      method: 'POST',
      headers: { 'x-user-id': String(user.user_id) },
      body: fd,
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to list item')
    } else {
      router.push(`/product/${json.product.product_id}`)
    }
  }

  if (error && !prefill) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center text-red-500">
          {error}
        </div>
        <Footer />
      </>
    )
  }

  if (!prefill) {
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
      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">
          Resell “{prefill.productName}”
        </h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
          <div>
            <label className="block mb-1">Product Name</label>
            <input
              type="text"
              value={prefill.productName}
              readOnly
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border p-2 rounded"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">
                Price (max ${prefill.purchasePrice})
              </label>
              <input
                type="number"
                step="0.01"
                max={prefill.purchasePrice}
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Quantity</label>
              <input
                type="number"
                value="1"
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Category</label>
            <input
              type="text"
              value={
                ['Clothing', 'Cosmetics', 'Electronics'][
                  prefill.categoryId - 1
                ]
              }
              readOnly
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Upload Images</label>
            <input
              type="file"
              multiple
              onChange={e => setImages(e.target.files)}
              className="w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            List Item for Sale
          </button>
        </form>
      </div>
      <Footer />
    </>
  )
}
