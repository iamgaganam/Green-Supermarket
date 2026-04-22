"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useCartStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js/pure";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "pk_test_your_stripe_public_key",
);

function CheckoutForm({
  orderId,
  amount,
}: {
  orderId: number;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getCartTotal, clearCart } = useCartStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment system not ready");
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const piResponse = await apiClient.createPaymentIntent(amount, orderId);
      const { client_secret } = piResponse.data;

      // Confirm payment with card
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement!,
        },
      });

      if (result.error) {
        toast.error(result.error.message);
        setLoading(false);
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        // Confirm payment on backend
        await apiClient.confirmPayment(result.paymentIntent.id);
        await clearCart(apiClient);
        toast.success("Payment successful!");
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="p-3 border border-gray-300 rounded-lg" />
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 cursor-pointer relative z-10"
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const { items, getCartTotal, isLoading } = useCartStore();
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    zipCode: user?.zip_code || "",
    country: user?.country || "",
    notes: "",
  });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
  }, [isHydrated, token, items, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateOrder = async () => {
    setSubmitting(true);
    try {
      const response = await apiClient.createOrder(
        `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}`,
        shippingInfo.notes,
      );
      setOrderId(response.data.order_id);
      setCurrentStep(2);
      toast.success("Order created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const total = getCartTotal();
  const subtotal = total;
  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : 10;
  const finalTotal = subtotal + tax + shipping;

  if (!token) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">
        Checkout
      </h1>

      {/* Progress Steps */}
      <div className="mb-12 flex items-center justify-center">
        <div className="flex items-center gap-8 w-full max-w-2xl">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-lg transition-colors ${
                currentStep >= 1
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
              }`}
            >
              1
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                currentStep >= 1
                  ? "text-green-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Shipping
            </span>
          </div>

          {/* Connector */}
          <div
            className={`flex-1 h-1 transition-colors ${
              currentStep >= 2 ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          ></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-lg transition-colors ${
                currentStep >= 2
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
              }`}
            >
              2
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                currentStep >= 2
                  ? "text-green-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Payment
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
            {currentStep === 1 ? (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  Shipping Information
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={shippingInfo.firstName}
                    onChange={handleInputChange}
                    className="col-span-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={shippingInfo.lastName}
                    onChange={handleInputChange}
                    className="col-span-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text"
                  />
                </div>

                <input
                  type="text"
                  name="address"
                  placeholder="Street Address"
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text mb-4"
                />

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={shippingInfo.zipCode}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text"
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={shippingInfo.country}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text"
                  />
                </div>

                <textarea
                  name="notes"
                  placeholder="Order Notes (optional)"
                  value={shippingInfo.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors cursor-text mb-6"
                  rows={3}
                />

                <button
                  onClick={handleCreateOrder}
                  disabled={submitting || !shippingInfo.address}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 cursor-pointer relative z-10"
                >
                  {submitting ? "Creating Order..." : "Continue to Payment"}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  Payment Method
                </h2>
                <Elements stripe={stripePromise}>
                  <CheckoutForm orderId={orderId || 0} amount={finalTotal} />
                </Elements>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-fit sticky top-24 transition-colors">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Order Summary
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping:</span>
              <span>${shipping > 0 ? shipping.toFixed(2) : "FREE"}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-green-600 dark:text-green-400">
                ${finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">
              Items
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                >
                  <span>
                    {item.product?.name} x {item.quantity}
                  </span>
                  <span>
                    ${(item.price_at_addition * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
