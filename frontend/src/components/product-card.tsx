"use client";

import { motion } from "framer-motion";
import { Heart, Package2, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";
import { getApiErrorMessage } from "@/lib/utils";

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  rating?: number;
  quantity_in_stock?: number;
  onAddToCart?: (productId: number, quantity: number) => void;
  isLoading?: boolean;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  category,
  rating,
  quantity_in_stock = 0,
  onAddToCart,
  isLoading,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const { token } = useAuthStore();
  const { addToWishlist, removeFromWishlist, wishlistProductIds } =
    useWishlistStore();
  const inStock = quantity_in_stock > 0;
  const isFavorite = wishlistProductIds.includes(id);

  const handleAddToCart = async () => {
    if (!onAddToCart) {
      return;
    }

    try {
      setIsAddingToCart(true);
      await new Promise((resolve) => setTimeout(resolve, 180));
      await Promise.resolve(onAddToCart(id, quantity));
      setQuantity(1);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleFavorite = async () => {
    if (!token) {
      toast.error("Please log in to add items to wishlist");
      return;
    }

    try {
      setIsUpdatingWishlist(true);
      if (isFavorite) {
        await removeFromWishlist(apiClient, id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(apiClient, id);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update wishlist"));
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      whileHover={{ y: inStock ? -8 : -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-700 dark:to-gray-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_42%)] opacity-80" />
        {imageUrl ? (
          /* biome-ignore lint/performance/noImgElement: product images come from runtime backend URLs. */
          <motion.img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/85 text-emerald-600 shadow-lg dark:bg-gray-900/80 dark:text-emerald-300"
          >
            <Package2 size={42} />
          </motion.div>
        )}

        <Badge className="absolute right-3 top-3 bg-emerald-600 text-white hover:bg-emerald-700">
          {category}
        </Badge>

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        <motion.button
          type="button"
          onClick={handleFavorite}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          disabled={isUpdatingWishlist}
          className="absolute left-3 top-3 rounded-full bg-white/85 p-2 shadow-sm transition hover:bg-white dark:bg-gray-900/85 dark:hover:bg-gray-800"
        >
          <Heart
            size={20}
            className={
              isFavorite
                ? "fill-red-600 text-red-600"
                : "text-gray-600 transition-colors hover:text-red-600 dark:text-gray-300"
            }
          />
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${id}`}>
          <h3 className="mb-1 line-clamp-2 cursor-pointer text-base font-semibold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400">
            {name}
          </h3>
        </Link>

        <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>

        {rating && (
          <div className="mb-3 flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={
                    star <= Math.round(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ({rating})
            </span>
          </div>
        )}

        <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

        <div className="mb-4 mt-auto flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-emerald-600">
              Rs. {price.toFixed(2)}
            </span>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {quantity_in_stock > 0
                ? `${quantity_in_stock} in stock`
                : "Out of stock"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {inStock && (
            <div className="flex items-center rounded-xl border border-gray-300 bg-white/80 shadow-sm dark:border-gray-600 dark:bg-gray-700/60">
              <button
                type="button"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="px-3 py-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="text"
                value={quantity}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value, 10) || 1;
                  if (value > 0 && value <= quantity_in_stock) {
                    setQuantity(value);
                  }
                }}
                className="w-10 bg-transparent py-2 text-center text-sm focus:outline-none dark:text-white"
              />
              <button
                type="button"
                onClick={() =>
                  quantity < quantity_in_stock && setQuantity(quantity + 1)
                }
                className="px-3 py-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                disabled={quantity >= quantity_in_stock}
              >
                +
              </button>
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={!inStock || isLoading || isAddingToCart}
            className="flex-1"
            size="sm"
          >
            <ShoppingCart size={16} className="mr-1" />
            {isAddingToCart ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
