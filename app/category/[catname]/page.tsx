'use client';

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import { FaStar, FaRegStar } from "react-icons/fa";

type Product = {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews_count: number;
};

export default function CategoryPage() {
  const rawCatname = useParams().catname;
  const category =
    typeof rawCatname === "string"
      ? rawCatname
      : Array.isArray(rawCatname)
      ? rawCatname[0]
      : "";

  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    setCurrentPage(p);
  }, [searchParams]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    setError("");

    fetch(
      `/api/products?category=${encodeURIComponent(
        category
      )}&page=${currentPage}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setProducts([]);
          setTotalCount(0);
        } else {
          setProducts(data.products || []);
          setTotalCount(data.totalCount || 0);
        }
      })
      .catch(() => {
        setError("Failed to load category products.");
      })
      .finally(() => setLoading(false));
  }, [category, currentPage]);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) =>
      i < Math.floor(rating) ? (
        <FaStar key={i} className="text-yellow-500" />
      ) : (
        <FaRegStar key={i} className="text-yellow-500" />
      )
    );

  const totalPages = Math.ceil(totalCount / 8);

  const gotoPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    router.push(
      `/category/${encodeURIComponent(category)}?page=${p}`
    );
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-screen-xl py-8 px-4">
        <h1 className="text-3xl font-bold capitalize mb-4">
          {category} Products
        </h1>

        {loading && <p className="text-center">Loading…</p>}
        {error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div className="cursor-pointer border rounded-lg p-4 shadow hover:shadow-md transition-shadow flex flex-col h-full justify-between">
                <img
                  src={
                    product.image ||
                    "https://via.placeholder.com/300x400?text=No+Image"
                  }
                  alt={product.name}
                  className="w-full h-64 object-cover rounded mb-4"
                />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center space-x-1 mb-2">
                    {renderStars(product.rating)}
                    <span className="text-sm text-gray-500">
                      ({product.reviews_count})
                    </span>
                  </div>
                </div>
                <p className="text-xl font-bold mt-4">
                  ${product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => gotoPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 border rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => gotoPage(pageNum)}
                className={`px-3 py-1 border rounded ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            )
          )}

          <button
            onClick={() => gotoPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
