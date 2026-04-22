"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
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
    fetchOrders();
  }, [isHydrated, token, router]);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.getOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">
        My Orders
      </h1>

      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Loading your orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            No orders yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Start shopping to create your first order
          </p>
          <Link
            href="/products"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order-confirmation/${order.id}`}
              className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-colors flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {order.order_number}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.payment_status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right flex items-center gap-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
                <ChevronRight className="text-gray-400 dark:text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
