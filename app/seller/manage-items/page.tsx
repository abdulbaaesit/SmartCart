'use client';

import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';

type Product = {
  product_id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
  tags?: string[];
  sizes?: { size: string; stock: number }[];
  condition?: string;
};

export default function ManageItems() {
  const { user } = useUserContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [newProductName, setNewProductName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newImages, setNewImages] = useState<FileList | null>(null);
  const [newSizes, setNewSizes] = useState<{ size: string; stock: number }[]>([]);

  const categoryMapping: Record<string, number> = {
    clothing: 1,
    cosmetics: 2,
    electronics: 3,
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSizes, setEditSizes] = useState<{ size: string; stock: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/seller/products?user_id=${user.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load products');
        setLoading(false);
      });
  }, [user]);

  const handleDeleteProduct = async (product_id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(
        `/api/seller/delete-product?product_id=${product_id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to delete product');
        return;
      }
      setProducts(products.filter((p) => p.product_id !== product_id));
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditDescription(prod.description || '');
    setEditPrice(prod.price.toString());
    setEditQuantity(prod.quantity.toString());
    setEditCategory(prod.category.toLowerCase());
    setEditTags(prod.tags ? prod.tags.join(', ') : '');
    setEditSizes(prod.sizes || []);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !user) return;
    const parsedPrice = parseFloat(editPrice) || 0;
    const parsedQuantity = parseInt(editQuantity, 10) || 0;
    const catId = categoryMapping[editCategory];
    if (!catId) {
      setError("Invalid category selected");
      return;
    }
    const payload = {
      product_id: editingProduct.product_id,
      name: editName,
      description: editDescription,
      price: parsedPrice,
      quantity: parsedQuantity,
      category_id: catId,
      tags: editTags.split(',').map((t) => t.trim()),
      sizes: editSizes,
    };
    try {
      const res = await fetch('/api/seller/edit-product', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to update product');
        return;
      }
      const data = await res.json();
      setProducts(
        products.map((p) =>
          p.product_id === data.product.product_id ? data.product : p
        )
      );
      setEditingProduct(null);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('User not found.');
      return;
    }
    const parsedPrice = parseFloat(newPrice) || 0;
    const parsedQuantity = parseInt(newQuantity, 10) || 0;
    const catId = categoryMapping[newCategory.toLowerCase()];
    if (!catId) {
      setError("Invalid category selected");
      return;
    }
    const formData = new FormData();
    formData.append('name', newProductName);
    formData.append('description', newDescription);
    formData.append('price', parsedPrice.toString());
    formData.append('quantity', parsedQuantity.toString());
    formData.append('category_id', catId.toString());
    formData.append('tags', newTags);
    formData.append('seller_id', user.user_id.toString());
    if (newImages) {
      for (let i = 0; i < newImages.length; i++) {
        formData.append('images', newImages[i]);
      }
    }
    if (newCategory.toLowerCase() === 'clothing') {
      formData.append('sizes', JSON.stringify(newSizes));
    }
    try {
      const res = await fetch('/api/seller/add-product', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to add product');
        return;
      }
      const data = await res.json();
      setProducts([...products, data.product]);
      setNewProductName('');
      setNewDescription('');
      setNewPrice('');
      setNewQuantity('');
      setNewCategory('');
      setNewTags('');
      setNewImages(null);
      setNewSizes([]);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Items</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Product Name</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Condition</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => (
            <tr key={prod.product_id}>
              <td className="border p-2">{prod.name}</td>
              <td className="border p-2">{prod.category}</td>
              <td className="border p-2">${prod.price}</td>
              <td className="border p-2">{prod.quantity}</td>
              <td className="border p-2">{prod.condition}</td>
              <td className="border p-2">{prod.description}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleOpenEdit(prod)} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                  Edit
                </button>
                <button onClick={() => handleDeleteProduct(prod.product_id)} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && !loading && (
            <tr>
              <td colSpan={7} className="text-center p-4">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Product Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={3}
                  required
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Price</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Quantity</label>
                  <input
                    type="text"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="clothing">Clothing</option>
                  <option value="cosmetics">Cosmetics</option>
                  <option value="electronics">Electronics</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border p-4 rounded">
        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block mb-1">Product Name</label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full border p-2 rounded"
              rows={3}
              placeholder="Enter product description"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Price</label>
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Quantity</label>
              <input
                type="text"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Select Category</option>
              <option value="clothing">Clothing</option>
              <option value="cosmetics">Cosmetics</option>
              <option value="electronics">Electronics</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Product Images</label>
            <input
              type="file"
              multiple
              onChange={(e) => setNewImages(e.target.files)}
              className="w-full"
              required
            />
          </div>
          {newCategory.toLowerCase() === 'clothing' && (
            <div>
              <label className="block mb-1">Available Sizes & Stock</label>
              <div className="grid grid-cols-3 gap-2">
                {['S', 'M', 'L'].map((size) => (
                  <div key={size}>
                    <label className="block text-sm font-medium">{size}</label>
                    <input
                      type="number"
                      placeholder="Stock"
                      className="w-full border p-1 rounded"
                      onChange={(e) => {
                        const stock = parseInt(e.target.value, 10) || 0;
                        setNewSizes((prev) => {
                          const filtered = prev.filter((s) => s.size !== size);
                          return [...filtered, { size, stock }];
                        });
                      }}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Add New Product
          </button>
        </form>
      </div>
    </div>
  );
}
