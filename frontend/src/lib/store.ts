import { create } from "zustand";
import { persist } from "zustand/middleware";
import ApiClient from "./api";
import { getApiErrorMessage, getApiErrorStatus } from "./utils";

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_addition: number;
  product?: {
    id: number;
    name: string;
    price: number;
    image_url: string;
  };
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_admin: boolean;
}

export interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  fetchCart: (client: ApiClient) => Promise<void>;
  addItem: (
    client: ApiClient,
    productId: number,
    quantity: number,
  ) => Promise<void>;
  updateItem: (
    client: ApiClient,
    itemId: number,
    quantity: number,
  ) => Promise<void>;
  removeItem: (client: ApiClient, itemId: number) => Promise<void>;
  clearCart: (client: ApiClient) => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export interface WishlistStore {
  wishlistCount: number;
  wishlistProductIds: number[];
  isLoading: boolean;
  error: string | null;

  fetchWishlist: (client: ApiClient) => Promise<void>;
  addToWishlist: (client: ApiClient, productId: number) => Promise<void>;
  removeFromWishlist: (client: ApiClient, productId: number) => Promise<void>;
  checkInWishlist: (client: ApiClient, productId: number) => Promise<boolean>;
  resetWishlist: () => void;
}

interface WishlistApiItem {
  product_id?: number;
}

async function waitForAuthHydration() {
  const authState = useAuthStore.getState();

  if (authState.isHydrated) {
    return authState;
  }

  await new Promise<void>((resolve) => {
    const checkHydration = () => {
      const state = useAuthStore.getState();

      if (state.isHydrated) {
        resolve();
        return;
      }

      setTimeout(checkHydration, 50);
    };

    checkHydration();
  });

  return useAuthStore.getState();
}

function normalizeWishlistProductIds(data: unknown) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as WishlistApiItem).product_id === "number"
      ) {
        return (item as WishlistApiItem).product_id;
      }

      return null;
    })
    .filter((productId): productId is number => typeof productId === "number");
}

// Theme Store
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage",
    },
  ),
);

// Wishlist Store
export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistCount: 0,
  wishlistProductIds: [],
  isLoading: false,
  error: null,

  fetchWishlist: async (client) => {
    set({ isLoading: true, error: null });
    try {
      const state = await waitForAuthHydration();

      if (!state.token) {
        set({
          wishlistCount: 0,
          wishlistProductIds: [],
          isLoading: false,
          error: null,
        });
        return;
      }

      const requestToken = state.token;
      client.setToken(requestToken);
      const response = await client.getWishlist();

      if (useAuthStore.getState().token !== requestToken) {
        return;
      }

      const wishlistProductIds = normalizeWishlistProductIds(response.data);
      set({
        wishlistCount: wishlistProductIds.length,
        wishlistProductIds,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to fetch wishlist"),
      });
    }
  },

  addToWishlist: async (client, productId) => {
    set({ isLoading: true, error: null });
    try {
      const state = await waitForAuthHydration();

      if (!state.token) {
        throw new Error("Please log in to add items to wishlist");
      }

      client.setToken(state.token);
      await client.addToWishlist(productId);
      set((state) => ({
        wishlistProductIds: state.wishlistProductIds.includes(productId)
          ? state.wishlistProductIds
          : [...state.wishlistProductIds, productId],
        wishlistCount: state.wishlistProductIds.includes(productId)
          ? state.wishlistCount
          : state.wishlistCount + 1,
        isLoading: false,
      }));
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        set((state) => ({
          wishlistProductIds: state.wishlistProductIds.includes(productId)
            ? state.wishlistProductIds
            : [...state.wishlistProductIds, productId],
          wishlistCount: state.wishlistProductIds.includes(productId)
            ? state.wishlistCount
            : state.wishlistCount + 1,
          isLoading: false,
          error: null,
        }));
        return;
      }

      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to add to wishlist"),
      });
      throw error;
    }
  },

  removeFromWishlist: async (client, productId) => {
    set({ isLoading: true, error: null });
    try {
      const state = await waitForAuthHydration();

      if (!state.token) {
        throw new Error("Please log in to manage wishlist");
      }

      client.setToken(state.token);
      await client.removeFromWishlist(productId);
      set((state) => ({
        wishlistProductIds: state.wishlistProductIds.filter(
          (id) => id !== productId,
        ),
        wishlistCount: Math.max(
          0,
          state.wishlistProductIds.filter((id) => id !== productId).length,
        ),
        isLoading: false,
      }));
    } catch (error) {
      if (getApiErrorStatus(error) === 404) {
        set((state) => ({
          wishlistProductIds: state.wishlistProductIds.filter(
            (id) => id !== productId,
          ),
          wishlistCount: Math.max(
            0,
            state.wishlistProductIds.filter((id) => id !== productId).length,
          ),
          isLoading: false,
          error: null,
        }));
        return;
      }

      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to remove from wishlist"),
      });
      throw error;
    }
  },

  checkInWishlist: async (client, productId) => {
    try {
      const state = await waitForAuthHydration();
      if (!state.token) return false;

      if (get().wishlistProductIds.length > 0) {
        return get().wishlistProductIds.includes(productId);
      }

      client.setToken(state.token);
      const response = await client.checkWishlist(productId);
      return response.data.in_wishlist || false;
    } catch {
      return false;
    }
  },

  resetWishlist: () =>
    set({
      wishlistCount: 0,
      wishlistProductIds: [],
      isLoading: false,
      error: null,
    }),
}));

// Auth Store
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isHydrated: false,

      register: async (email, password, firstName, lastName) => {
        set({ isLoading: true, error: null });
        try {
          const client = new ApiClient();
          await client.register(email, password, firstName, lastName);
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error, "Registration failed"),
          });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const client = new ApiClient();
          const response = await client.login(email, password);
          const { token, user } = response.data;

          set({ user, token, isLoading: false });
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error, "Login failed"),
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    },
  ),
);

// Cart Store
export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchCart: async (client) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure token is set before making the request
      const state = useAuthStore.getState();
      if (state.token) {
        client.setToken(state.token);
      }
      const response = await client.getCart();
      set({ items: response.data.items || [], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to fetch cart"),
      });
    }
  },

  addItem: async (client, productId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure token is set before making the request
      const state = useAuthStore.getState();
      if (state.token) {
        client.setToken(state.token);
      }
      await client.addToCart(productId, quantity);
      // Re-fetch cart
      const response = await client.getCart();
      set({ items: response.data.items || [], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to add item"),
      });
      throw error;
    }
  },

  updateItem: async (client, itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure token is set before making the request
      const state = useAuthStore.getState();
      if (state.token) {
        client.setToken(state.token);
      }
      await client.updateCartItem(itemId, quantity);
      // Re-fetch cart
      const response = await client.getCart();
      set({ items: response.data.items || [], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to update item"),
      });
      throw error;
    }
  },

  removeItem: async (client, itemId) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure token is set before making the request
      const state = useAuthStore.getState();
      if (state.token) {
        client.setToken(state.token);
      }
      await client.removeCartItem(itemId);
      // Re-fetch cart
      const response = await client.getCart();
      set({ items: response.data.items || [], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to remove item"),
      });
      throw error;
    }
  },

  clearCart: async (client) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure token is set before making the request
      const state = useAuthStore.getState();
      if (state.token) {
        client.setToken(state.token);
      }
      await client.clearCart();
      set({ items: [], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, "Failed to clear cart"),
      });
      throw error;
    }
  },

  getCartTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.price_at_addition * item.quantity,
      0,
    );
  },

  getCartItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
