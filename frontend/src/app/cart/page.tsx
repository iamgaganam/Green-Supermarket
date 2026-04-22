"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useCartStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ShoppingBag, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CartPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const { items, isLoading, fetchCart, updateItem, removeItem, getCartTotal } =
    useCartStore();

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }
    apiClient.setToken(token);
    fetchCart(apiClient);
  }, [isHydrated, token, router]);

  if (!isHydrated) {
    return null;
  }

  if (!token) {
    return null;
  }

  const total = getCartTotal();
  const subtotal = total;
  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : 10;
  const finalTotal = subtotal + tax + shipping;

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeItem(apiClient, itemId);
        toast.success("Item removed from cart");
      } else {
        await updateItem(apiClient, itemId, newQuantity);
        toast.success("Quantity updated");
      }
    } catch (error) {
      toast.error("Failed to update cart");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(apiClient, itemId);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <ShoppingBag size={64} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start shopping to add items to your cart. We have fresh produce
              and essentials waiting for you!
            </p>
            <Button size="lg" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6 flex gap-6">
                    {/* Product Image */}
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden dark:from-gray-800 dark:to-gray-700 transition-colors">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-5xl">🥬</div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {item.product?.name}
                        </h3>
                        <p className="text-emerald-600 font-bold text-lg mt-3">
                          ${item.price_at_addition.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={isLoading}
                          className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
                        >
                          <Minus size={18} className="text-gray-600" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-12 px-2 py-1 border border-gray-300 rounded-lg text-center focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          disabled={isLoading}
                        />
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={isLoading}
                          className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
                        >
                          <Plus size={18} className="text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal and Remove */}
                    <div className="text-right flex flex-col justify-between items-end">
                      <p>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          Subtotal:{" "}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                          ${(item.price_at_addition * item.quantity).toFixed(2)}
                        </span>
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden">
                <div className="p-8 space-y-8">
                  {/* Promo Info */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 dark:bg-emerald-500/10 dark:border-emerald-500/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <Package
                        size={20}
                        className="text-emerald-600 flex-shrink-0 mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                          Free shipping on orders over $100
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                          {subtotal > 100
                            ? "You qualified for free shipping!"
                            : `Add $${(100 - subtotal).toFixed(2)} more for free shipping`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order Summary
                  </h2>

                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (10%)</span>
                      <span className="font-semibold">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <div className="flex items-center gap-2">
                        <Truck size={16} />
                        <span>Shipping</span>
                      </div>
                      <span className="font-semibold">
                        {shipping > 0 ? `$${shipping.toFixed(2)}` : "FREE"}
                      </span>
                    </div>

                    <div className="border-t border-gray-300 pt-4 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading || items.length === 0}
                    size="lg"
                    className="w-full"
                  >
                    Proceed to Checkout
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/products")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
