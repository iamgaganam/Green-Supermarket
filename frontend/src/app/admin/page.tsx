"use client";

import { Edit, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuthStore, useThemeStore } from "@/lib/store";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity_in_stock: number;
  category: string;
  image_url?: string;
  sku: string;
  is_active: boolean;
}

interface Feedback {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  title: string;
  comment: string;
  author: string;
  created_at: string;
}

interface GeneralFeedback {
  id: number;
  email: string;
  name: string;
  message: string;
  rating: number;
  created_at: string;
}

interface Stats {
  average_rating: number;
  total_feedback: number;
  rating_distribution: Array<{ rating: number; count: number }>;
}

type AdminTab =
  | "overview"
  | "products"
  | "feedback"
  | "general-feedback"
  | "subscribers";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const STAR = "\u2605";

function getErrorMessage(error: unknown, fallback: string) {
  const maybeResponse =
    typeof error === "object" && error !== null && "response" in error
      ? error.response
      : undefined;
  const maybeData =
    typeof maybeResponse === "object" &&
    maybeResponse !== null &&
    "data" in maybeResponse
      ? maybeResponse.data
      : undefined;

  return typeof maybeData === "object" &&
    maybeData !== null &&
    "error" in maybeData &&
    typeof maybeData.error === "string"
    ? maybeData.error
    : fallback;
}

export default function AdminPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [generalFeedbacks, setGeneralFeedbacks] = useState<GeneralFeedback[]>(
    [],
  );
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribers, setSubscribers] = useState<
    Array<{ id: number; email: string; created_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity_in_stock: "",
    category: "",
    image_url: "",
    sku: "",
  });

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [feedbacksRes, statsRes, productsRes] = await Promise.all([
        apiClient.getAllFeedback(),
        apiClient.getFeedbackStats(),
        apiClient.getProducts(undefined, 100),
      ]);
      setFeedbacks(feedbacksRes.data || []);
      setStats(statsRes.data);
      setProducts(productsRes.data || []);

      try {
        const generalFeedbacksRes = await apiClient.getAdminGeneralFeedback();
        setGeneralFeedbacks(generalFeedbacksRes.data || []);
      } catch (error) {
        console.error("Failed to fetch general feedback", error);
        setGeneralFeedbacks([]);
      }

      try {
        const subscribersRes = await apiClient.getSubscribers();
        setSubscribers(subscribersRes.data || []);
      } catch (error) {
        console.error("Failed to fetch subscribers", error);
        setSubscribers([]);
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    if (!user?.is_admin) {
      router.push("/");
      return;
    }

    apiClient.setToken(token);
    void fetchAdminData();
  }, [fetchAdminData, isHydrated, token, user, router]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      quantity_in_stock: "",
      category: "",
      image_url: "",
      sku: "",
    });
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity_in_stock: product.quantity_in_stock.toString(),
      category: product.category,
      image_url: product.image_url || "",
      sku: product.sku,
    });
    setShowProductForm(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.price ||
      !formData.category ||
      !formData.sku
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        quantity_in_stock: Number.parseInt(formData.quantity_in_stock, 10),
        category: formData.category,
        image_url: formData.image_url,
        sku: formData.sku,
        is_active: true,
      };

      if (editingProduct) {
        await apiClient.updateProduct(editingProduct.id, productData);
        toast.success("Product updated successfully!");
      } else {
        await apiClient.createProduct(productData);
        toast.success("Product created successfully!");
      }

      setShowProductForm(false);
      await fetchAdminData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product"));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const product = products.find((item) => item.id === id);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        quantity_in_stock: product.quantity_in_stock,
        category: product.category,
        image_url: product.image_url,
        sku: product.sku,
        is_active: false,
      };

      await apiClient.updateProduct(id, productData);
      setProducts((prev) => prev.filter((item) => item.id !== id));
      toast.success("Product deleted successfully!");
      await fetchAdminData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getErrorMessage(error, "Failed to delete product"));
      void fetchAdminData();
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      await apiClient.deleteFeedback(id);
      toast.success("Feedback deleted successfully!");
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      await fetchAdminData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getErrorMessage(error, "Failed to delete feedback"));
      void fetchAdminData();
    }
  };

  const handleDeleteGeneralFeedback = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      await apiClient.deleteGeneralFeedback(id);
      toast.success("Feedback deleted successfully!");
      setGeneralFeedbacks((prev) => prev.filter((item) => item.id !== id));
      await fetchAdminData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getErrorMessage(error, "Failed to delete feedback"));
      void fetchAdminData();
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email} from subscribers?`))
      return;

    try {
      await apiClient.deleteSubscriber(email);
      toast.success("Subscriber deleted successfully!");
      setSubscribers((prev) => prev.filter((item) => item.email !== email));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getErrorMessage(error, "Failed to delete subscriber"));
    }
  };

  if (!token || !user?.is_admin) {
    return null;
  }

  const chartData =
    stats?.rating_distribution.map((item) => ({
      rating: `${item.rating}${STAR}`,
      count: item.count,
    })) || [];
  const activeProducts = products.filter((product) => product.is_active);
  const averageRating = stats ? stats.average_rating.toFixed(2) : "0.00";
  const totalFeedback = stats?.total_feedback ?? 0;

  const surfaceClass =
    "rounded-xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900";
  const tableWrapperClass = `${surfaceClass} overflow-hidden`;
  const labelClass =
    "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";
  const tableHeadClass =
    "border-b border-gray-200 bg-gray-50/90 dark:border-gray-800 dark:bg-gray-950/70";
  const tableHeaderCellClass =
    "px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400";
  const tableRowClass =
    "border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60";
  const primaryCellClass = "px-6 py-4 text-sm text-gray-900 dark:text-gray-100";
  const secondaryCellClass =
    "px-6 py-4 text-sm text-gray-600 dark:text-gray-400";
  const editButtonClass =
    "rounded-lg p-2 text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10";
  const deleteButtonClass =
    "rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10";
  const chartAxisColor = isDark ? "#9ca3af" : "#4b5563";
  const chartGridColor = isDark ? "#374151" : "#d1d5db";
  const chartTooltipStyle = {
    backgroundColor: isDark ? "#111827" : "#ffffff",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 12,
    color: isDark ? "#f9fafb" : "#111827",
    boxShadow: isDark
      ? "0 16px 32px rgba(0, 0, 0, 0.35)"
      : "0 16px 32px rgba(15, 23, 42, 0.1)",
  };
  const chartTooltipLabelStyle = {
    color: isDark ? "#f9fafb" : "#111827",
    fontWeight: 600,
  };
  const tabClass = (tab: AdminTab) =>
    `whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
      activeTab === tab
        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
        : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    }`;
  const renderStars = (rating: number) => STAR.repeat(rating);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="max-w-2xl text-base text-gray-600 dark:text-gray-400">
          Monitor products, customer feedback, and subscribers with a single
          dashboard that stays consistent in both themes.
        </p>
      </div>

      <div className="mb-8 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        <div className="flex min-w-max gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={tabClass("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={tabClass("products")}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            className={tabClass("feedback")}
          >
            Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("general-feedback")}
            className={tabClass("general-feedback")}
          >
            General Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscribers")}
            className={tabClass("subscribers")}
          >
            Email Subscribers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading data...
          </p>
        </div>
      ) : activeTab === "overview" ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className={`${surfaceClass} p-8`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Total Products
              </p>
              <p className="text-5xl font-bold text-emerald-500">
                {activeProducts.length}
              </p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Active products
              </p>
            </div>
            <div className={`${surfaceClass} p-8`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Average Rating
              </p>
              <p className="text-5xl font-bold text-amber-500">
                {averageRating}
                <span className="ml-2 text-4xl align-middle">{STAR}</span>
              </p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                From {totalFeedback} reviews
              </p>
            </div>
            <div className={`${surfaceClass} p-8`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Total Feedback
              </p>
              <p className="text-5xl font-bold text-blue-500">
                {totalFeedback}
              </p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Customer reviews
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className={`${surfaceClass} p-6`}>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Rating Distribution
              </h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke={chartGridColor}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="rating"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartAxisColor, fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartAxisColor, fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{
                        fill: isDark
                          ? "rgba(148, 163, 184, 0.08)"
                          : "rgba(148, 163, 184, 0.12)",
                      }}
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                    />
                    <Bar
                      dataKey="count"
                      fill="#22c55e"
                      radius={[12, 12, 4, 4]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-gray-600 dark:text-gray-400">
                  No data available
                </p>
              )}
            </div>

            <div className={`${surfaceClass} p-6`}>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Rating Breakdown
              </h2>
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="rating"
                        cx="50%"
                        cy="50%"
                        outerRadius={88}
                        label={{
                          fill: isDark ? "#e5e7eb" : "#374151",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        labelLine={{ stroke: chartGridColor }}
                      >
                        {chartData.map((item, index) => (
                          <Cell
                            key={item.rating}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipLabelStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {chartData.map((item, index) => (
                      <div
                        key={item.rating}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span>{item.rating}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-gray-600 dark:text-gray-400">
                  No data available
                </p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "products" ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Product Management
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create, update, and archive products without breaking dark mode.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          {showProductForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-sm">
              <div
                className={`${surfaceClass} max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl shadow-black/40`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6 dark:border-gray-800">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {editingProduct
                        ? "Update the product details and keep the catalog in sync."
                        : "Add a new product using the same dark-aware form controls."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmitProduct} className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="product-name" className={labelClass}>
                        Product Name *
                      </label>
                      <Input
                        id="product-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="product-sku" className={labelClass}>
                        SKU *
                      </label>
                      <Input
                        id="product-sku"
                        type="text"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="product-description" className={labelClass}>
                      Description
                    </label>
                    <Textarea
                      id="product-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="product-price" className={labelClass}>
                        Price ($) *
                      </label>
                      <Input
                        id="product-price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="product-quantity" className={labelClass}>
                        Quantity *
                      </label>
                      <Input
                        id="product-quantity"
                        type="number"
                        value={formData.quantity_in_stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity_in_stock: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="product-category" className={labelClass}>
                        Category *
                      </label>
                      <Select
                        id="product-category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        required
                      >
                        <option value="">Select category</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Meat">Meat</option>
                        <option value="Pantry">Pantry</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="product-image-url" className={labelClass}>
                      Image URL
                    </label>
                    <Input
                      id="product-image-url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      {editingProduct ? "Update Product" : "Create Product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="flex-1 rounded-lg border border-gray-300 bg-gray-100 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className={tableWrapperClass}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeaderCellClass}>Product</th>
                    <th className={tableHeaderCellClass}>Category</th>
                    <th className={tableHeaderCellClass}>Price</th>
                    <th className={tableHeaderCellClass}>Stock</th>
                    <th className={tableHeaderCellClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400"
                      >
                        No products found
                      </td>
                    </tr>
                  ) : (
                    activeProducts.map((product) => (
                      <tr key={product.id} className={tableRowClass}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.sku}
                            </p>
                          </div>
                        </td>
                        <td className={secondaryCellClass}>
                          {product.category}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-500">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className={primaryCellClass}>
                          {product.quantity_in_stock}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className={editButtonClass}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className={deleteButtonClass}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "feedback" ? (
        <div className={tableWrapperClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableHeaderCellClass}>Author</th>
                  <th className={tableHeaderCellClass}>Product</th>
                  <th className={tableHeaderCellClass}>Rating</th>
                  <th className={tableHeaderCellClass}>Title</th>
                  <th className={tableHeaderCellClass}>Comment</th>
                  <th className={`${tableHeaderCellClass} text-center`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400"
                    >
                      No feedback yet
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((feedback) => (
                    <tr key={feedback.id} className={tableRowClass}>
                      <td className={primaryCellClass}>{feedback.author}</td>
                      <td className={secondaryCellClass}>
                        Product #{feedback.product_id}
                      </td>
                      <td className="px-6 py-4 text-lg text-amber-400">
                        {renderStars(feedback.rating)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {feedback.title}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {feedback.comment}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(feedback.id)}
                          className={deleteButtonClass}
                          title="Delete feedback"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "general-feedback" ? (
        <div className={tableWrapperClass}>
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              General Feedback
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Feedback from customers about your service
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableHeaderCellClass}>Name</th>
                  <th className={tableHeaderCellClass}>Email</th>
                  <th className={tableHeaderCellClass}>Rating</th>
                  <th className={tableHeaderCellClass}>Message</th>
                  <th className={tableHeaderCellClass}>Date</th>
                  <th className={`${tableHeaderCellClass} text-center`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {generalFeedbacks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400"
                    >
                      No general feedback yet
                    </td>
                  </tr>
                ) : (
                  generalFeedbacks.map((feedback) => (
                    <tr key={feedback.id} className={tableRowClass}>
                      <td className={primaryCellClass}>{feedback.name}</td>
                      <td className={secondaryCellClass}>{feedback.email}</td>
                      <td className="px-6 py-4 text-lg text-amber-400">
                        {renderStars(feedback.rating)}
                      </td>
                      <td className="max-w-md truncate px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {feedback.message}
                      </td>
                      <td className={secondaryCellClass}>
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteGeneralFeedback(feedback.id)
                          }
                          className={deleteButtonClass}
                          title="Delete feedback"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "subscribers" ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Subscribers
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Keep track of the mailing list in the same visual system as the
              rest of the admin dashboard.
            </p>
          </div>

          <div className={`${surfaceClass} p-6`}>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Subscribers
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {subscribers.length}
            </p>
          </div>

          {subscribers.length === 0 ? (
            <div className={`${surfaceClass} p-8 text-center`}>
              <p className="text-gray-500 dark:text-gray-400">
                No subscribers yet
              </p>
            </div>
          ) : (
            <div className={tableWrapperClass}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className={tableHeaderCellClass}>Email</th>
                      <th className={tableHeaderCellClass}>Subscribed Date</th>
                      <th className={`${tableHeaderCellClass} text-center`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className={tableRowClass}>
                        <td className={primaryCellClass}>{subscriber.email}</td>
                        <td className={secondaryCellClass}>
                          {new Date(subscriber.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSubscriber(subscriber.email)
                            }
                            className={deleteButtonClass}
                            title="Remove subscriber"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
