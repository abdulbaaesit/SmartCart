'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaSearch, FaUser } from 'react-icons/fa'
import { useUserContext } from '@/context/UserContext'

export default function Navbar() {
  const router = useRouter()
  const { user, setUser, cart: ctxCart, wishlist: ctxWishlist, setCart, setWishlist } = useUserContext()
  const cart = Array.isArray(ctxCart) ? ctxCart : []
  const wishlist = Array.isArray(ctxWishlist) ? ctxWishlist : []
  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setDarkMode(localStorage.getItem('darkMode') === 'true')
  }, [])

  useEffect(() => {
    if (!user) {
      setCart([])
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/cart', { headers: { 'x-user-id': String(user.user_id) }, cache: 'no-store' })
        if (!res.ok) throw new Error()
        const { items } = await res.json()
        setCart(items)
      } catch {}
    })()
  }, [user, setCart])

  useEffect(() => {
    if (!user) {
      setWishlist([])
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/wishlist', { headers: { 'x-user-id': String(user.user_id) }, cache: 'no-store' })
        if (!res.ok) throw new Error()
        const { items } = await res.json()
        setWishlist(items)
      } catch {}
    })()
  }, [user, setWishlist])

  useEffect(() => {
    const onDM = () => setDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('darkmode-change', onDM)
    return () => window.removeEventListener('darkmode-change', onDM)
  }, [])

  const toggleDark = () => {
    const nd = !darkMode
    localStorage.setItem('darkMode', JSON.stringify(nd))
    window.dispatchEvent(new Event('darkmode-change'))
  }

  const handleSearch = () => {
    const q = searchTerm.trim()
    router.push(q ? `/search?query=${encodeURIComponent(q)}&page=1` : '/search')
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShowDropdown(true)
  }
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowDropdown(false), 200)
  }
  const handleLogout = () => {
    setUser(null)
    setCart([])
    setWishlist([])
  }

  return (
    <nav className={`w-full shadow py-2 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="flex items-center justify-evenly w-full px-4">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            SmartCart
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/category/clothing" className="hover:underline">Clothing</Link>
          <Link href="/category/cosmetics" className="hover:underline">Cosmetics</Link>
          <Link href="/category/electronics" className="hover:underline">Electronics</Link>
        </div>
        <div className="relative hidden md:block w-1/3 max-w-md">
          <input
            type="text"
            placeholder="Search for products…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className={`w-full py-2 pl-4 pr-10 rounded-full focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-800 placeholder-gray-400 text-white focus:ring-gray-500' : 'bg-gray-100 placeholder-gray-500 focus:ring-blue-500'}`}
          />
          <FaSearch
            size={16}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}
            onClick={handleSearch}
          />
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleDark} className="text-xl">{darkMode ? '☀️' : '🌙'}</button>
          <Link href="/wishlist" className="hover:underline">♡ {wishlist.length}</Link>
          <Link href="/cart" className="hover:underline">🛒 {totalCartItems}</Link>
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
            <button className="hover:underline">
              <FaUser size={20} />
            </button>
            {showDropdown && (
              <div className={`absolute right-0 mt-2 w-40 rounded shadow-md z-50 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                {user ? (
                  <>
                    <Link href="/orders" className="block px-4 py-2 hover:bg-gray-200">My Orders</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-200">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 hover:bg-gray-200">Login</Link>
                    <Link href="/signup" className="block px-4 py-2 hover:bg-gray-200">Signup</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
