'use client';

import React, { useState } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';


export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<'Buyer' | 'Seller'>('Buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Invalid email format.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
      } else {
        setSuccess('Signup successful! You can now log in.');
        router.push('/')
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-md shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>

        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-500 mb-2">{success}</p>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={() => setRole('Buyer')}
              className={`px-6 py-2 border border-blue-600 rounded-l-full transition-colors
                ${role === 'Buyer' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}
              `}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole('Seller')}
              className={`px-6 py-2 border border-blue-600 rounded-r-full transition-colors
                ${role === 'Seller' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}
              `}
            >
              Seller
            </button>
          </div>

          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-full
                       hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center mt-4">
          Already a user?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login Now
          </Link>
        </p>
      </div>
    </div>
  );
}
