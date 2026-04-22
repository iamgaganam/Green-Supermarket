"use client";

import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";
import { getApiErrorMessage } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  quantity_in_stock: number;
}

interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
  added_at: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();
  const { fetchWishlist: syncWishlistCount, removeFromWishlist } =
    useWishlistStore();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getWishlist();
      setWishlist(response.data || []);
      await syncWishlistCount(apiClient);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load wishlist"));
    } finally {
      setLoading(false);
    }
  }, [syncWishlistCount]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    apiClient.setToken(token);
    void fetchWishlist();
  }, [isHydrated, token, router, fetchWishlist]);

  const handleRemove = async (productId: number) => {
    try {
      await removeFromWishlist(apiClient, productId);
      setWishlist((current) =>
        current.filter((item) => item.product_id !== productId),
      );
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove from wishlist"));
    }
  };

  const handleAddToCart = () => {
    router.push(`/products`);
    toast.info("Add product to cart from products page");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-950 dark:to-gray-900 py-12 transition-colors">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-gray-700 dark:text-gray-300">
            Loading your wishlist...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-950 dark:to-gray-900 py-12 transition-colors">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/products")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Button>
        </div>

        {wishlist.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart
              size={48}
              className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
            />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start adding items to your wishlist to save them for later
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition"
              >
                {/* Product Image */}
                <div className="relative w-full h-48 bg-gray-200">
                  {item.product.image_url ? (
                    /* biome-ignore lint/performance/noImgElement: wishlist images come from runtime backend URLs. */
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <span className="text-gray-400 dark:text-gray-500">
                        No image
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.product_id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.product.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-600">
                      Rs. {item.product.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.product.quantity_in_stock > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                      }`}
                    >
                      {item.product.quantity_in_stock > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={item.product.quantity_in_stock === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
