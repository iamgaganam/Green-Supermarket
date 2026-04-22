import axios, { AxiosInstance } from "axios";

const DEFAULT_API_PORT = "8080";

function isLoopbackHost(hostname: string) {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function getApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configuredUrl) {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_API_PORT}`;
    }

    return `http://localhost:${DEFAULT_API_PORT}`;
  }

  if (typeof window === "undefined") {
    return configuredUrl;
  }

  try {
    const url = new URL(configuredUrl);

    if (
      isLoopbackHost(url.hostname) &&
      !isLoopbackHost(window.location.hostname)
    ) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
}

interface ApiConfig {
  token?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config?: ApiConfig) {
    this.client = axios.create({
      baseURL: getApiUrl(),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (config?.token) {
      this.client.defaults.headers.common["Authorization"] =
        `Bearer ${config.token}`;
    }
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.client.defaults.headers.common["Authorization"];
  }

  // Auth endpoints
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    return this.client.post("/api/auth/register", {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
  }

  async login(email: string, password: string) {
    return this.client.post("/api/auth/login", { email, password });
  }

  // User endpoints
  async getUserProfile() {
    return this.client.get("/api/users/profile");
  }

  async updateUserProfile(userData: any) {
    return this.client.put("/api/users/profile", userData);
  }

  async deleteUserAccount() {
    return this.client.delete("/api/users/profile");
  }

  // Products endpoints
  async getProducts(category?: string, limit?: number, offset?: number) {
    return this.client.get("/api/products", {
      params: { category, limit, offset },
    });
  }

  async getProduct(id: number) {
    return this.client.get(`/api/products/${id}`);
  }

  async getCategories() {
    return this.client.get("/api/categories");
  }

  async getProductFeedback(id: number) {
    return this.client.get(`/api/products/${id}/feedback`);
  }

  // Cart endpoints
  async getCart() {
    return this.client.get("/api/cart");
  }

  async addToCart(productId: number, quantity: number) {
    return this.client.post("/api/cart/items", {
      product_id: productId,
      quantity,
    });
  }

  async updateCartItem(itemId: number, quantity: number) {
    return this.client.put(`/api/cart/items/${itemId}`, { quantity });
  }

  async removeCartItem(itemId: number) {
    return this.client.delete(`/api/cart/items/${itemId}`);
  }

  async clearCart() {
    return this.client.delete("/api/cart/clear");
  }

  // Orders endpoints
  async createOrder(shippingAddress: string, notes?: string) {
    return this.client.post("/api/orders", {
      shipping_address: shippingAddress,
      notes,
    });
  }

  async getOrders() {
    return this.client.get("/api/orders");
  }

  async getOrder(id: number) {
    return this.client.get(`/api/orders/${id}`);
  }

  async cancelOrder(id: number) {
    return this.client.post(`/api/orders/${id}/cancel`);
  }

  // Payment endpoints
  async createPaymentIntent(amount: number, orderId: number) {
    return this.client.post("/api/payments", {
      amount,
      currency: "usd",
      order_id: orderId,
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return this.client.post("/api/payments/confirm", {
      payment_intent_id: paymentIntentId,
    });
  }

  async getPaymentStatus(paymentId: string) {
    return this.client.get(`/api/payments/${paymentId}`);
  }

  async getPaymentPublicKey() {
    return this.client.get("/api/payments/public-key");
  }

  // Feedback endpoints
  async createFeedback(
    rating: number,
    title: string,
    comment: string,
    orderId?: number,
    productId?: number,
  ) {
    return this.client.post("/api/feedback", {
      rating,
      title,
      comment,
      order_id: orderId,
      product_id: productId,
    });
  }

  async getFeedback() {
    return this.client.get("/api/feedback");
  }

  async deleteFeedback(feedbackId: number) {
    return this.client.delete(`/api/feedback/${feedbackId}`);
  }

  async getAllFeedback() {
    return this.client.get("/api/admin/feedback");
  }

  async getFeedbackStats() {
    return this.client.get("/api/admin/feedback/stats");
  }

  // Subscriber endpoints
  async createSubscriber(email: string) {
    return this.client.post("/api/subscribers", { email });
  }

  async getSubscribers() {
    return this.client.get("/api/admin/subscribers");
  }

  async deleteSubscriber(email: string) {
    return this.client.delete("/api/admin/subscribers", {
      data: { email },
    });
  }

  // General Feedback endpoints
  async createGeneralFeedback(
    email: string,
    name: string,
    message: string,
    rating: number,
  ) {
    return this.client.post("/api/general-feedback", {
      email,
      name,
      message,
      rating,
    });
  }

  async getGeneralFeedback() {
    return this.client.get("/api/general-feedback");
  }

  async getUserGeneralFeedback() {
    return this.client.get("/api/user/general-feedback");
  }

  async getAdminGeneralFeedback() {
    return this.client.get("/api/admin/general-feedback");
  }

  async deleteGeneralFeedback(feedbackId: number) {
    return this.client.delete(`/api/general-feedback/${feedbackId}`);
  }

  // Wishlist endpoints
  async addToWishlist(productId: number) {
    return this.client.post("/api/wishlist", { product_id: productId });
  }

  async getWishlist() {
    return this.client.get("/api/wishlist");
  }

  async removeFromWishlist(productId: number) {
    return this.client.delete(`/api/wishlist/${productId}`);
  }

  async checkWishlist(productId: number) {
    return this.client.get("/api/wishlist/check", {
      params: { product_id: productId },
    });
  }

  async clearWishlist() {
    return this.client.delete("/api/wishlist/clear");
  }

  // Discount codes endpoints
  async validateDiscountCode(code: string, amount: number) {
    return this.client.post("/api/discount/validate", {
      code,
      amount,
    });
  }

  // Deals endpoints
  async getDealsOfDay() {
    return this.client.get("/api/deals/today");
  }

  async getUpcomingDeals() {
    return this.client.get("/api/deals/upcoming");
  }

  // Recommendations endpoints
  async getRecommendations(limit?: number) {
    return this.client.get("/api/recommendations", {
      params: { limit: limit || 10 },
    });
  }

  async getTrendingProducts(limit?: number) {
    return this.client.get("/api/products/trending", {
      params: { limit: limit || 10 },
    });
  }

  async getSimilarProducts(productId: number, limit?: number) {
    return this.client.get("/api/products/similar", {
      params: { product_id: productId, limit: limit || 5 },
    });
  }

  async recordProductView(productId: number) {
    return this.client.post("/api/products/view", null, {
      params: { product_id: productId },
    });
  }

  // Analytics endpoints
  async getAnalytics() {
    return this.client.get("/api/admin/analytics");
  }

  async getAnalyticsSummary() {
    return this.client.get("/api/admin/analytics/summary");
  }

  // Inventory endpoints
  async getInventoryLog(productId?: number) {
    return this.client.get("/api/admin/inventory-log", {
      params: productId ? { product_id: productId } : {},
    });
  }

  async getLowStockProducts(threshold?: number) {
    return this.client.get("/api/admin/inventory/low-stock", {
      params: { threshold: threshold || 10 },
    });
  }

  async getInventorySummary() {
    return this.client.get("/api/admin/inventory/summary");
  }

  async updateInventory(productId: number, quantity: number, reason: string) {
    return this.client.put(`/api/admin/inventory/${productId}`, {
      quantity,
      reason,
    });
  }

  // Admin endpoints
  async createProduct(productData: any) {
    return this.client.post("/api/products", productData);
  }

  async updateProduct(id: number, productData: any) {
    return this.client.put(`/api/products/${id}`, productData);
  }

  // Admin discount codes
  async createDiscountCode(codeData: any) {
    return this.client.post("/api/admin/discount-codes", codeData);
  }

  async getDiscountCodes() {
    return this.client.get("/api/admin/discount-codes");
  }

  async updateDiscountCode(codeId: number, codeData: any) {
    return this.client.put(`/api/admin/discount-codes/${codeId}`, codeData);
  }

  async deleteDiscountCode(codeId: number) {
    return this.client.delete(`/api/admin/discount-codes/${codeId}`);
  }

  // Admin deals
  async createDeal(dealData: any) {
    return this.client.post("/api/admin/deals", dealData);
  }

  async updateDeal(dealId: number, dealData: any) {
    return this.client.put(`/api/admin/deals/${dealId}`, dealData);
  }

  async deleteDeal(dealId: number) {
    return this.client.delete(`/api/admin/deals/${dealId}`);
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
