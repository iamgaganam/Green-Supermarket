"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";

export function InitializeAuth() {
  const { token, isHydrated } = useAuthStore();
  const { fetchWishlist, resetWishlist } = useWishlistStore();

  useEffect(() => {
    // Wait for store to be hydrated from localStorage
    if (!isHydrated) {
      return;
    }

    if (token) {
      apiClient.setToken(token);
      void fetchWishlist(apiClient);
    } else {
      apiClient.clearToken();
      resetWishlist();
    }
  }, [token, isHydrated, fetchWishlist, resetWishlist]);

  return null;
}
