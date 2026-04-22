"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore, useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { Star, ShoppingCart, ChevronLeft } from "lucide-react";
import Link from "next/link";
import FeedbackForm from "@/components/feedback-form";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  quantity_in_stock: number;
  sku: string;
}

interface Feedback {
  id: number;
  author: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

export default function ProductPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  const { token } = useAuthStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
    fetchProduct();
  }, [token, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const [productRes, feedbackRes] = await Promise.all([
        apiClient.getProduct(productId),
        apiClient.getProductFeedback(productId),
      ]);
      setProduct(productRes.data);
      setFeedbacks(feedbackRes.data || []);

      // Calculate average rating
      if (feedbackRes.data && feedbackRes.data.length > 0) {
        const avg =
          feedbackRes.data.reduce(
            (sum: number, f: Feedback) => sum + f.rating,
            0,
          ) / feedbackRes.data.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error("Failed to fetch product", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      if (!token) {
        toast.error("Please login first");
        return;
      }
      await addItem(apiClient, productId, quantity);
      toast.success(`${quantity} item(s) added to cart!`);
      setQuantity(1);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Product not found
        </h1>
        <Link
          href="/products"
          className="text-green-600 hover:text-green-700 mt-4"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <Link
        href="/products"
        className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-8"
      >
        <ChevronLeft size={20} />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Image */}
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-200 transition-colors dark:bg-gray-800">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-8xl">🥬</div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-6">
            <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              {product.category}
            </span>
          </div>

          <h1 className="mb-4 text-4xl font-bold text-gray-800 dark:text-white">
            {product.name}
          </h1>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  className={
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              ))}
            </div>
            {feedbacks.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                ({averageRating.toFixed(1)}) {feedbacks.length} reviews
              </p>
            )}
          </div>

          {/* Price and Stock */}
          <div className="mb-6 rounded-lg bg-gray-50 p-6 transition-colors dark:border dark:border-gray-800 dark:bg-gray-900">
            <p className="text-5xl font-bold text-green-600 mb-4">
              ${product.price.toFixed(2)}
            </p>
            <p
              className={`text-lg font-semibold mb-4 ${
                product.quantity_in_stock > 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {product.quantity_in_stock > 0
                ? `${product.quantity_in_stock} in stock`
                : "Out of stock"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SKU: {product.sku}
            </p>
          </div>

          {/* Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                max={product.quantity_in_stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value)))
                }
                className="w-20 rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                disabled={product.quantity_in_stock === 0}
              />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.quantity_in_stock === 0}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart size={24} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mb-12 rounded-lg border border-gray-200 bg-white p-8 shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-8 text-3xl font-bold text-gray-800 dark:text-white">
          Customer Reviews
        </h2>

        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No reviews yet. Be the first to review!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="border-b border-gray-200 pb-6 last:border-b-0 dark:border-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white">
                      {feedback.author}
                    </p>
                    <div className="flex mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < feedback.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </p>
                </div>
                <h3 className="mb-2 font-bold text-gray-800 dark:text-white">
                  {feedback.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {feedback.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Form */}
      <div className="mb-12">
        <FeedbackForm productId={productId} onSuccess={() => fetchProduct()} />
      </div>
    </div>
  );
}
