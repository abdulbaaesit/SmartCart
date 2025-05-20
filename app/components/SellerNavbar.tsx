'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';

export default function SellerNavbar() {
  const { setUser } = useUserContext();
  const router = useRouter();

  const handleSignOut = () => {
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="w-full bg-blue-600 text-white py-4 shadow">
      <div className="container mx-auto flex items-center justify-around">
        <Link href="/seller/dashboard" className="font-bold text-lg hover:underline">
          Dashboard
        </Link>
        <Link href="/seller/manage-items" className="font-bold text-lg hover:underline">
          Manage Items
        </Link>
        <button 
          onClick={handleSignOut} 
          className="font-bold text-lg hover:underline focus:outline-none"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
