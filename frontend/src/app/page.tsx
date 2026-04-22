"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Leaf,
  Shield,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import GeneralFeedbackDisplay from "@/components/general-feedback-display";
import GeneralFeedbackForm from "@/components/general-feedback-form";
import {
  fadeUp,
  quickTransition,
  Reveal,
  Stagger,
  scaleIn,
} from "@/components/motion";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useAuthStore, useCartStore } from "@/lib/store";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  quantity_in_stock: number;
}

const featureItems = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Same-day delivery available for orders placed before 2 PM",
    color:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    icon: Shield,
    title: "Secure Checkout",
    description: "Protected payments with trusted methods and clean order flow",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    icon: Leaf,
    title: "Fresh Quality",
    description:
      "Carefully sourced produce and pantry staples picked for quality",
    color:
      "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300",
  },
  {
    icon: Clock,
    title: "Responsive Support",
    description: "A support team that is available whenever you need help",
    color:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  },
];

const heroStats = [
  { label: "Fresh picks", value: "500+" },
  { label: "Average delivery", value: "45 min" },
  { label: "Happy shoppers", value: "10k+" },
];

const featuredSkeletonIds = [
  "featured-skeleton-1",
  "featured-skeleton-2",
  "featured-skeleton-3",
  "featured-skeleton-4",
  "featured-skeleton-5",
  "featured-skeleton-6",
  "featured-skeleton-7",
  "featured-skeleton-8",
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [feedbackRefresh, setFeedbackRefresh] = useState(0);
  const { token } = useAuthStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (token) {
          apiClient.setToken(token);
        }

        const response = await apiClient.getProducts(undefined, 8);
        setProducts(response.data || []);
      } catch (error) {
        console.error("Failed to fetch products", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [token]);

  const handleAddToCart = async (productId: number, quantity: number) => {
    try {
      if (!token) {
        toast.error("Please login first");
        return;
      }
      await addItem(apiClient, productId, quantity);
      toast.success("Product added to cart");
    } catch {
      toast.error("Failed to add product to cart");
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscriberEmail || !subscriberEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSubscribing(true);
      await apiClient.createSubscriber(subscriberEmail);
      toast.success("Successfully subscribed to our newsletter!");
      setSubscriberEmail("");
    } catch (error) {
      if (getApiErrorStatus(error) === 200) {
        toast.success("Email already subscribed!");
      } else {
        toast.error(getApiErrorMessage(error, "Failed to subscribe"));
      }
      setSubscriberEmail("");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 transition-colors dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_38%)]" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-500/10 animate-float-soft" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-green-100/70 blur-3xl dark:bg-green-500/10 animate-float-soft-delayed" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-24 md:grid-cols-2 md:gap-16 md:py-28">
          <Stagger className="space-y-8" staggerChildren={0.12}>
            <motion.div
              variants={scaleIn(0.94)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/85 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300"
            >
              <Sparkles size={16} />
              Freshly curated every day
            </motion.div>

            <motion.h1
              variants={fadeUp(24)}
              className="max-w-xl text-5xl font-bold leading-tight text-gray-900 dark:text-white md:text-6xl"
            >
              Fresh groceries with a smoother way to shop.
            </motion.h1>

            <motion.p
              variants={fadeUp(28)}
              className="max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 md:text-xl"
            >
              Shop produce, pantry essentials, and household favourites with a
              storefront that feels fast, clean, and dependable from browse to
              checkout.
            </motion.p>

            <motion.div
              variants={fadeUp(30)}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Shop Now
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white/90 px-8 py-3 font-semibold text-gray-900 shadow-sm backdrop-blur transition hover:bg-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-white dark:hover:bg-gray-800"
                >
                  Browse Categories
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp(34)}
              className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {heroStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/75"
                >
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Stagger>

          <Reveal className="relative hidden md:block" y={32}>
            <div className="relative mx-auto h-[390px] w-full max-w-[430px]">
              <div className="absolute inset-x-8 bottom-10 top-12 rounded-[2.6rem] bg-white/75 shadow-[0_24px_60px_-34px_rgba(16,185,129,0.24)] ring-1 ring-white/80 backdrop-blur dark:bg-gray-900/70 dark:ring-gray-800/80" />
              <div className="absolute left-8 top-[4.5rem] h-16 w-16 rounded-full bg-emerald-200/55 blur-3xl dark:bg-emerald-500/15 animate-float-soft" />
              <div className="absolute bottom-12 right-8 h-16 w-16 rounded-full bg-green-200/55 blur-3xl dark:bg-green-500/15 animate-float-soft-delayed" />

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
                className="pointer-events-none absolute left-0 top-5 z-20 w-[15.25rem] rounded-[1.35rem] border border-white/70 bg-white/94 px-4 py-3.5 shadow-lg shadow-emerald-950/10 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/90"
              >
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                  Morning harvest
                </div>
                <div className="mt-2 text-[0.98rem] font-semibold leading-snug text-gray-800 dark:text-gray-100">
                  Picked and packed with cold-chain care.
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 7,
                  delay: 0.4,
                  repeat: Number.POSITIVE_INFINITY,
                }}
                className="pointer-events-none absolute bottom-3 right-0 z-20 w-[14.75rem] rounded-[1.35rem] border border-white/70 bg-white/94 px-4 py-3.5 shadow-lg shadow-emerald-950/10 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/90"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Truck size={15} className="text-emerald-500" />
                  Same-day delivery
                </div>
                <div className="mt-1.5 text-[0.9rem] leading-relaxed text-gray-600 dark:text-gray-400">
                  Real-time fulfilment from cart to doorstep.
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[4.65rem] top-[4.85rem] z-10 flex h-[245px] w-[270px] flex-col rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 px-5 py-5 text-white shadow-[0_28px_70px_-30px_rgba(16,185,129,0.42)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-emerald-50 backdrop-blur">
                    Fresh Daily
                  </span>
                  <Sparkles size={15} className="text-emerald-100" />
                </div>

                <div className="mt-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-white/15 backdrop-blur">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, -6, 0] }}
                      transition={{
                        duration: 5.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <Leaf size={30} />
                    </motion.div>
                  </div>
                  <h2 className="max-w-[10rem] text-[1.95rem] font-bold leading-[1]">
                    Peak freshness,
                    <br />
                    packed with care.
                  </h2>
                  <p className="mt-3 max-w-[11.5rem] text-[0.82rem] leading-relaxed text-emerald-50/90">
                    Orders are packed to stay crisp, organised, and easy to
                    receive.
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <div className="rounded-[1rem] bg-white/10 px-3 py-2.5 backdrop-blur">
                    <div className="text-[0.68rem] text-emerald-100">
                      Delivery window
                    </div>
                    <div className="mt-1 text-[0.95rem] font-semibold text-white">
                      Under 1 hour
                    </div>
                  </div>
                  <div className="rounded-[1rem] bg-white/10 px-3 py-2.5 backdrop-blur">
                    <div className="text-[0.68rem] text-emerald-100">
                      Repeat shoppers
                    </div>
                    <div className="mt-1 text-[0.95rem] font-semibold text-white">
                      92%
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 transition-colors dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Why GREEN feels better to use
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Clearer flows, dependable service, and motion that supports the
              experience instead of distracting from it
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((feature) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp(24)}
                  whileHover={{ y: -8 }}
                  transition={quickTransition}
                >
                  <Card className="group h-full overflow-hidden border-gray-200/80">
                    <div className="p-8 text-center">
                      <div
                        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon size={32} />
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </Stagger>
        </div>
      </section>

      <section className="bg-gray-50 py-20 transition-colors dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Sparkles className="text-emerald-600" size={24} />
                <span className="font-semibold text-emerald-600">Featured</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                Best Sellers This Week
              </h2>
            </div>
            <Link href="/products">
              <Button variant="outline">
                View All
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredSkeletonIds.map((skeletonId) => (
                <Card key={skeletonId} className="h-96 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <Stagger
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
              staggerChildren={0.08}
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={fadeUp(18)}
                  className="h-full"
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    imageUrl={product.image_url}
                    category={product.category}
                    quantity_in_stock={product.quantity_in_stock}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </Stagger>
          ) : (
            <Card className="col-span-full p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Sparkles size={30} />
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                No products available
              </p>
            </Card>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-emerald-600 to-green-600 py-16 text-white">
        <Reveal className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            className="mb-6 flex justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY }}
          >
            <TrendingUp size={48} className="text-emerald-100" />
          </motion.div>
          <h2 className="mb-4 text-4xl font-bold">
            Save more with a loyalty program that feels worth joining
          </h2>
          <p className="mb-8 text-xl text-emerald-50">
            Unlock exclusive deals, early access, and points on every order.
          </p>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="bg-white text-emerald-600 shadow-lg shadow-emerald-900/15 hover:bg-emerald-50"
            >
              Join Now
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        </Reveal>
      </section>

      <section className="bg-white py-20 transition-colors dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              What our customers say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Real feedback from shoppers using GREEN every week
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Reveal className="lg:col-span-1" y={28}>
              <Card className="sticky top-24 border-gray-200/80">
                <div className="p-8">
                  <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                    Share your experience
                  </h3>
                  <GeneralFeedbackForm
                    onSuccess={() => setFeedbackRefresh((r) => r + 1)}
                  />
                </div>
              </Card>
            </Reveal>

            <Reveal className="lg:col-span-2" y={32} delay={0.08}>
              <GeneralFeedbackDisplay onUpdate={feedbackRefresh} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-50 to-green-50 py-20 transition-colors dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-2xl px-4">
          <Reveal y={28}>
            <Card className="overflow-hidden border-white/70 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.35)] dark:border-gray-800/80">
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 p-12 text-center text-white">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                  <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-1/2 translate-y-1/2 rounded-full bg-white" />
                </div>
                <div className="absolute inset-y-0 left-0 w-1/3 bg-white/20 blur-3xl animate-shimmer-x" />

                <div className="relative">
                  <h2 className="mb-2 text-4xl font-bold">
                    Subscribe to our newsletter
                  </h2>
                  <p className="mb-8 text-emerald-50">
                    Get exclusive offers, product updates, and smart promos
                    without the clutter.
                  </p>
                  <form
                    onSubmit={handleSubscribe}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      disabled={subscribing}
                      className="flex-1 rounded-xl px-6 py-3 text-gray-900 placeholder:text-gray-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <Button
                      type="submit"
                      disabled={subscribing}
                      className="bg-white px-8 font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      {subscribing ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
