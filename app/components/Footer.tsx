'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDarkMode(localStorage.getItem('darkMode') === 'true')
    const onDM = () => setDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('darkmode-change', onDM)
    return () => window.removeEventListener('darkmode-change', onDM)
  }, [])

  return (
    <footer className={`${darkMode ? 'bg-black text-white' : 'bg-[#00229A] text-white'} py-8 mt-20`}>
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">SmartCart</h2>
            <p className="mb-4">Discover the smartest way to shop!</p>
            <div className="flex space-x-4">
              <Link href="/" aria-label="Facebook">
                Facebook
              </Link>
              <Link href="/" aria-label="Twitter">
                Twitter
              </Link>
              <Link href="/" aria-label="Instagram">
                Instagram
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">COMPANY</h3>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:underline">About</Link></li>
              <li><Link href="/" className="hover:underline">Features</Link></li>
              <li><Link href="/" className="hover:underline">Works</Link></li>
              <li><Link href="/" className="hover:underline">Career</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">HELP</h3>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:underline">Customer Support</Link></li>
              <li><Link href="/" className="hover:underline">Delivery Details</Link></li>
              <li><Link href="/" className="hover:underline">Terms & Conditions</Link></li>
              <li><Link href="/" className="hover:underline">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">FAQ</h3>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:underline">Account</Link></li>
              <li><Link href="/" className="hover:underline">Manage Deliveries</Link></li>
              <li><Link href="/" className="hover:underline">Orders</Link></li>
              <li><Link href="/" className="hover:underline">Payments</Link></li>
            </ul>
          </div>
        </div>
        <div className={`border-t border-white/20 pt-4 flex flex-col md:flex-row items-center justify-between`}>
          <p className="text-sm mb-2 md:mb-0">
            SmartCart.com © 2025. All Rights Reserved
          </p>
          <div className="flex space-x-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="MasterCard" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
          </div>
        </div>
      </div>
    </footer>
  )
}
