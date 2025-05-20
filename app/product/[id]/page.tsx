'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaRegStar, FaMinus, FaPlus, FaHeart } from 'react-icons/fa';

import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useUserContext } from '@/context/UserContext';

type Review = {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  rating: number;
  images: string[];
  sizes?: { size: string; stock: number }[];
};

type RelatedProduct = {
  id: number;
  name: string;
  price: number;
  image: string;
};

type CartItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
};

type WishlistItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
};

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    user,
    cart,
    setCart,
    wishlist,
    setWishlist,
  } = useUserContext();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<RelatedProduct[]>([]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [hasPurchased, setHasPurchased] = useState<boolean>(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    async function loadAll() {
      try {
        const p = await fetch(`/api/products/${id}`);
        if (!p.ok) throw new Error('Could not fetch product');
        const { product } = await p.json();
        setProduct(product);
        if (product.sizes?.length) {
          setSelectedSize(product.sizes[0].size);
        }

        const rv = await fetch(`/api/products/${id}/reviews`);
        if (!rv.ok) throw new Error('Could not fetch reviews');
        const { reviews } = await rv.json();
        setReviews(reviews || []);

        const rl = await fetch(`/api/products/${id}/related`);
        if (!rl.ok) throw new Error('Could not fetch related');
        const { products: rel } = await rl.json();
        setRelated(rel || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/cart', {
      headers: { 'x-user-id': String(user.user_id) },
    })
      .then(res => res.json())
      .then(data => setCart(data.items || []))
      .catch(console.error);
  }, [user, setCart]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/wishlist', {
      headers: { 'x-user-id': String(user.user_id) },
    })
      .then(res => res.json())
      .then(data => setWishlist(data.items || []))
      .catch(console.error);
  }, [user, setWishlist]);

  useEffect(() => {
    if (!user || !id) return;
    fetch(`/api/orders/purchased?productId=${id}`, {
      headers: { 'x-user-id': String(user.user_id) },
    })
      .then(res => res.json())
      .then(json => setHasPurchased(!!json.hasPurchased))
      .catch(() => setHasPurchased(false));
  }, [user, id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center">Loading…</div>
        <Footer />
      </>
    );
  }
  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 text-center text-red-600">
          Error: {error || 'Product not found'}
        </div>
        <Footer />
      </>
    );
  }

  const availableStock = product.sizes
    ? product.sizes.find(s => s.size === selectedSize)?.stock ?? 0
    : product.quantity;

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : product.rating;

  const renderStars = (r: number) =>
    Array.from({ length: 5 }, (_, i) =>
      i < Math.floor(r) ? (
        <FaStar key={i} className="text-yellow-500" />
      ) : (
        <FaRegStar key={i} className="text-yellow-500" />
      )
    );

  const handleAddToCart = async () => {
    if (availableStock === 0) {
      alert('Sorry, this item is out of stock.');
      return;
    }
    if (quantity > availableStock) {
      alert(`Cannot add more than ${availableStock} to your cart.`);
      return;
    }
    if (product.sizes && !selectedSize) {
      alert('Please select a size.');
      return;
    }

    const newItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
      size: product.sizes ? selectedSize : undefined,
    };

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user?.user_id),
        },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add to cart');
      }
      const { items } = await res.json();
      setCart(items);
      router.push('/cart');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      alert('Please log in to add to your wishlist.');
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.user_id),
        },
        body: JSON.stringify({ productId: product.id } as Pick<WishlistItem, 'productId'>),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add to wishlist');
      }
      const { items } = await res.json();
      setWishlist(items);
      alert('Added to wishlist!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to write a review.');
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      const { review } = await res.json();
      setReviews(r => [...r, review]);
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewComment('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAiSummarize = async () => {
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/reviews-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Summarization failed');
      setAiSummary(json.summary || '— no summary returned —');
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="border rounded-lg overflow-hidden mb-4 max-w-sm mx-auto">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full object-cover"
              />
            </div>
            <div className="flex gap-2 justify-center">
              {product.images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="border rounded-lg w-20 h-20 overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center mb-2">
              {renderStars(averageRating)}
              <span className="ml-2 text-gray-600">{averageRating}</span>
            </div>
            <p className="text-2xl font-semibold mb-4">${product.price}</p>
            <p className="mb-2 text-gray-700">{product.description}</p>
            <p className="mb-4 text-gray-600">Available: {availableStock}</p>

            {product.sizes && (
              <div className="mb-4">
                <p className="font-semibold mb-2">Sizes:</p>
                <div className="flex gap-2">
                  {product.sizes.map(s => (
                    <button
                      key={s.size}
                      onClick={() => setSelectedSize(s.size)}
                      className={
                        'px-4 py-2 border rounded ' +
                        (selectedSize === s.size
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100')
                      }
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex items-center gap-4">
              <span className="font-semibold">Quantity:</span>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  <FaMinus />
                </button>
                <span className="px-4">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(q => Math.min(q + 1, availableStock))
                  }
                  disabled={quantity >= availableStock}
                  className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50"
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                className={`flex-1 px-6 py-3 rounded text-white ${availableStock === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToWishlist}
                className="flex-1 px-6 py-3 rounded text-white bg-red-600 hover:bg-red-700"
              >
                <FaHeart className="inline mr-2" />
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            All Reviews ({reviews.length})
          </h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleAiSummarize}
              disabled={reviews.length === 0 || aiLoading}
              className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              {aiLoading ? 'Summarizing…' : 'AI Summarizer'}
            </button>
            <button
              onClick={() =>
                setReviews(r => [...r].sort((a, b) => b.rating - a.rating))
              }
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Sort Reviews
            </button>
            {user ? (
              hasPurchased ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Write a Review
                </button>
              ) : (
                <span className="text-gray-500 italic">
                  Only purchasers can write a review.
                </span>
              )
            ) : (
              <span className="text-gray-500 italic">
                Log in to write a review.
              </span>
            )}
          </div>

          {aiError && <p className="text-red-500 mb-4">Error: {aiError}</p>}

          {aiSummary && (
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
              <h3 className="font-semibold mb-2">Overall Summary:</h3>
              <p>{aiSummary}</p>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-600">No reviews yet.</p>
          ) : (
            reviews.map(rev => (
              <div
                key={rev.id}
                className="border rounded-lg p-4 mb-4 bg-white"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{rev.userName}</span>
                  <div className="flex">{renderStars(rev.rating)}</div>
                </div>
                <p className="text-sm text-gray-500 mb-1">{rev.date}</p>
                <p>{rev.comment}</p>
              </div>
            ))
          )}

          {showReviewForm && hasPurchased && (
            <form
              onSubmit={handleReviewSubmit}
              className="border rounded-lg p-6 bg-white"
            >
              <h3 className="text-xl font-bold mb-4">Write a Review</h3>
              <div className="mb-4">
                <label className="block mb-1">Rating (1–5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={reviewRating}
                  onChange={e => setReviewRating(+e.target.value)}
                  className="w-20 border rounded px-2 py-1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(p => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="block border rounded-lg p-4 hover:shadow"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="font-bold">${p.price}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
