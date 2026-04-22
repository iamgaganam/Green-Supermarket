"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, GridIcon, ListIcon, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { quickTransition, Reveal } from "@/components/motion";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useAuthStore, useCartStore } from "@/lib/store";
import { cn, getApiErrorMessage } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  quantity_in_stock: number;
}

function normalizeCategories(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return Array.from(
    new Set(
      data
        .map((category) => {
          if (typeof category === "string") {
            return category.trim();
          }

          if (
            category &&
            typeof category === "object" &&
            "name" in category &&
            typeof category.name === "string"
          ) {
            return category.name.trim();
          }

          return "";
        })
        .filter(Boolean),
    ),
  );
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get("search") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParamValue);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high">(
    "name",
  );
  const { token } = useAuthStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (token) {
          apiClient.setToken(token);
        }

        const [productsRes, categoriesRes] = await Promise.all([
          apiClient.getProducts(selectedCategory || undefined),
          apiClient.getCategories(),
        ]);
        setProducts(productsRes.data || []);
        setCategories(normalizeCategories(categoriesRes.data));
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load products"));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [token, selectedCategory]);

  useEffect(() => {
    setSearchTerm(searchParamValue);
  }, [searchParamValue]);

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  const handleAddToCart = async (productId: number, quantity: number) => {
    try {
      await addItem(apiClient, productId, quantity);
      toast.success("Added to cart!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add to cart"));
    }
  };

  const categoryButtonClass = (active: boolean) =>
    cn(
      "block w-full rounded-xl px-4 py-2 text-left font-medium transition",
      active
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 py-8 transition-colors dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Search size={15} />
            Find products faster
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            Fresh Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse organic produce, pantry staples, and essentials with smoother
            filtering and result updates.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Reveal className="hidden md:block" y={24}>
            <Card className="sticky top-24 space-y-6 border-gray-200/80 p-6">
              <div>
                <label
                  htmlFor="product-search-desktop"
                  className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Search
                </label>
                <div className="relative">
                  <input
                    id="product-search-desktop"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
                  Category
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={categoryButtonClass(selectedCategory === "")}
                  >
                    All Products
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={categoryButtonClass(
                        selectedCategory === category,
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-sort-desktop"
                  className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Sort By
                </label>
                <select
                  id="product-sort-desktop"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "name" | "price-low" | "price-high",
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                </select>
              </div>
            </Card>
          </Reveal>

          <div className="md:col-span-3">
            <Reveal className="mb-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70 md:hidden">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters((open) => !open)}
                    className="flex items-center space-x-2"
                  >
                    <Filter size={16} />
                    <span>Filters</span>
                  </Button>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "rounded-lg p-2 transition",
                        viewMode === "grid"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                      )}
                    >
                      <GridIcon size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "rounded-lg p-2 transition",
                        viewMode === "list"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                      )}
                    >
                      <ListIcon size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredProducts.length} result
                  {filteredProducts.length === 1 ? "" : "s"}
                  {selectedCategory ? ` in ${selectedCategory}` : ""}
                </div>
              </div>
            </Reveal>

            <AnimatePresence initial={false}>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={quickTransition}
                  className="overflow-hidden md:hidden"
                >
                  <Card className="mb-6 space-y-6 border-gray-200/80 p-6">
                    <div>
                      <label
                        htmlFor="product-search-mobile"
                        className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Search
                      </label>
                      <div className="relative">
                        <input
                          id="product-search-mobile"
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search products..."
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
                        Category
                      </p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("");
                            setShowFilters(false);
                          }}
                          className={categoryButtonClass(
                            selectedCategory === "",
                          )}
                        >
                          All Products
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowFilters(false);
                            }}
                            className={categoryButtonClass(
                              selectedCategory === category,
                            )}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="product-sort-mobile"
                        className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Sort By
                      </label>
                      <select
                        id="product-sort-mobile"
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(
                            e.target.value as
                              | "name"
                              | "price-low"
                              | "price-high",
                          );
                          setShowFilters(false);
                        }}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="name">Name (A-Z)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                      </select>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Reveal className="mb-6 hidden md:block" y={20}>
              <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredProducts.length} result
                  {filteredProducts.length === 1 ? "" : "s"}
                  {selectedCategory ? ` in ${selectedCategory}` : ""}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Sorted by{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {sortBy === "name"
                      ? "Name"
                      : sortBy === "price-low"
                        ? "Price: Low to High"
                        : "Price: High to Low"}
                  </span>
                </div>
              </div>
            </Reveal>

            {loading && (
              <div className="flex h-64 items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.9,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  <div className="h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </motion.div>
              </div>
            )}

            {!loading && filteredProducts.length > 0 && (
              <motion.div
                layout
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                }
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      imageUrl={product.image_url}
                      category={product.category}
                      quantity_in_stock={product.quantity_in_stock}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <Reveal y={20}>
                <Card className="flex h-64 flex-col items-center justify-center border-dashed border-gray-300 bg-white/70 text-center dark:border-gray-700 dark:bg-gray-900/70">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Search size={30} />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                    No products found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filters to widen the results.
                  </p>
                </Card>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
