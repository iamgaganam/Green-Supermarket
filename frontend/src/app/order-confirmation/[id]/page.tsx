"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  const { token, isHydrated } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    fetchOrder();
  }, [isHydrated, token, orderId, router]);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.getOrder(parseInt(orderId as string));
      setOrder(response.data);
    } catch (error) {
      console.error("Failed to fetch order", error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Loading order details...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
        <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
          Order Confirmed!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Thank you for your order. We've sent a confirmation email to your
          inbox.
        </p>

        {order && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12 text-left transition-colors">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Order Details
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Order Number
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {order.order_number}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Total Amount
                </p>
                <p className="text-xl font-bold text-green-600">
                  ${order.total_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Status</p>
                <p className="text-lg font-semibold text-blue-600 capitalize">
                  {order.status}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Payment Status
                </p>
                <p className="text-lg font-semibold text-green-600 capitalize">
                  {order.payment_status}
                </p>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-gray-700 dark:text-gray-300"
                    >
                      <span>
                        {item.product?.name} x {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.shipping_address && (
              <div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                  Shipping Address
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {order.shipping_address}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link
            href="/products"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="bg-gray-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
