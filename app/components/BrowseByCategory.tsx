'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Anton } from 'next/font/google';

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
});

type Category = {
  id: number;
  name: string;
  image: string;
  base: string;
};

const categories: Category[] = [
  { id: 1, name: 'Clothing',   image: 'ch1.jpg', base: 'clothing' },
  { id: 2, name: 'Electronics',image: 'ch2.jpg', base: 'electronics' },
  { id: 3, name: 'Cosmetics',  image: 'ch3.jpg', base: 'cosmetics' },
];

export default function BrowseByCategory() {
  const router = useRouter();

  const handleClick = (cat: Category) => {
    router.push(`/category/${cat.base}`);
  };

  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-screen-xl mx-auto bg-[#00229A] rounded-lg shadow-md p-6">
        <h2 className={`text-3xl text-white text-center mb-6 ${anton.className}`}>
          BROWSE BY CATEGORY
        </h2>
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-[600px]">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              onClick={() => handleClick(cat)}
              className={`
                relative rounded-md overflow-hidden group cursor-pointer
                ${idx === 0 ? 'row-span-2' : ''}
              `}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3
                className="
                  absolute z-10 text-2xl font-bold top-4 left-4 drop-shadow
                  text-black group-hover:text-white transition-colors
                "
              >
                {cat.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
