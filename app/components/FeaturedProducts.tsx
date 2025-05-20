'use client';

import React, { useEffect, useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { Anton } from 'next/font/google';
import Link from 'next/link';

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
});

type Product = {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews_count: number;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/products/featured')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProducts(data.products || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load featured products.');
        setLoading(false);
      });
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Math.floor(rating)
        ? <FaStar key={i} className="text-yellow-500" />
        : <FaRegStar key={i} className="text-yellow-500" />
    ));
  };

  if (loading) return <p className="text-center py-8">Loading…</p>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

  return (
    <section className="mx-auto max-w-screen-xl py-8 px-4">
      <div className={`text-3xl ${anton.className}`}>
        <h2 className="text-center my-3">FEATURED PRODUCTS</h2>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex flex-col h-full cursor-pointer border rounded-lg p-4 shadow hover:shadow-md transition-shadow"
          >
            <div className="w-full h-64 overflow-hidden rounded mb-4">
              <img
                src={product.image || 'https://via.placeholder.com/300x400?text=No+Image'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold mb-1 truncate">{product.name}</h3>
            <div className="flex items-center space-x-1 mb-2">
              {renderStars(product.rating)}
              <span className="text-sm text-gray-500">({product.reviews_count})</span>
            </div>
            <p className="text-xl font-bold mt-auto">${product.price}</p>
          </Link>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/search?page=1"
          className="inline-block px-6 py-2 border rounded-md font-semibold hover:bg-black hover:text-white transition-colors"
        >
          View All
        </Link>
      </div>
    </section>
  );
}
