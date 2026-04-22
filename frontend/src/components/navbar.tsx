"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Home,
  LogOut,
  Menu,
  Moon,
  Package2,
  Search,
  ShoppingCart,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/brand-logo";
import { quickTransition } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  useAuthStore,
  useCartStore,
  useThemeStore,
  useWishlistStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  category?: string | null;
}

const mobileMenuContainer = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const mobileMenuItem = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: quickTransition },
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { getCartItemCount } = useCartStore();
  const { wishlistCount } = useWishlistStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const cartCount = getCartItemCount();
  const trimmedSearchQuery = searchQuery.trim();

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSearchProducts = async () => {
      try {
        setIsSearchLoading(true);
        const productsRes = await apiClient.getProducts(undefined, 200, 0);

        if (!isMounted) {
          return;
        }

        const products = Array.isArray(productsRes.data)
          ? (productsRes.data as SearchProduct[])
          : [];
        setSearchProducts(products);
      } catch {
        if (isMounted) {
          setSearchProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsSearchLoading(false);
        }
      }
    };

    loadSearchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const searchResults = useMemo(() => {
    if (!trimmedSearchQuery) {
      return [];
    }

    const normalizedSearch = trimmedSearchQuery.toLowerCase();

    return searchProducts
      .filter((product) => {
        const productName = product.name.toLowerCase();
        const productCategory = (product.category || "").toLowerCase();

        return (
          productName.includes(normalizedSearch) ||
          productCategory.includes(normalizedSearch)
        );
      })
      .slice(0, 6);
  }, [searchProducts, trimmedSearchQuery]);

  const showSearchDropdown =
    isSearchDropdownOpen && trimmedSearchQuery.length > 0;

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setIsOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsSearchDropdownOpen(Boolean(value.trim()));
  };

  const handleSearchFocus = () => {
    if (trimmedSearchQuery) {
      setIsSearchDropdownOpen(true);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchDropdownOpen(false);
    }, 120);
  };

  const closeMobilePanels = () => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setIsSearchDropdownOpen(false);
  };

  const handleViewAllResults = () => {
    if (!trimmedSearchQuery) {
      return;
    }

    router.push(`/products?search=${encodeURIComponent(trimmedSearchQuery)}`);
    setIsSearchDropdownOpen(false);
    setIsSearchOpen(false);
    setIsOpen(false);
  };

  const handleSuggestionClick = (productId: number) => {
    router.push(`/product/${productId}`);
    setSearchQuery("");
    setIsSearchDropdownOpen(false);
    setIsSearchOpen(false);
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleViewAllResults();
  };

  const desktopLinkClass = (href: string) =>
    cn(
      "relative text-sm font-medium transition after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-emerald-500 after:transition-transform after:duration-200 hover:after:scale-x-100",
      theme === "dark"
        ? "text-gray-300 hover:text-emerald-400"
        : "text-gray-700 hover:text-emerald-600",
      isActiveLink(href) &&
        "after:scale-x-100 after:bg-emerald-500 text-emerald-600 dark:text-emerald-400",
    );

  const renderSearchDropdown = () => (
    <AnimatePresence>
      {showSearchDropdown ? (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={quickTransition}
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl",
            theme === "dark"
              ? "border-gray-700/70 bg-gray-900/95"
              : "border-white/70 bg-white/95",
          )}
        >
          <div className="max-h-80 overflow-y-auto">
            {isSearchLoading ? (
              <div
                className={cn(
                  "px-4 py-3 text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-500",
                )}
              >
                Loading products...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionClick(product.id)}
                  className={cn(
                    "w-full border-b px-4 py-3 text-left transition last:border-b-0",
                    theme === "dark"
                      ? "border-gray-800 hover:bg-gray-800/80"
                      : "border-gray-100 hover:bg-emerald-50/90",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "truncate font-medium",
                        theme === "dark" ? "text-white" : "text-gray-900",
                      )}
                    >
                      {product.name}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        theme === "dark"
                          ? "text-emerald-400"
                          : "text-emerald-600",
                      )}
                    >
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      theme === "dark" ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    {product.category || "Product"}
                  </p>
                </button>
              ))
            ) : (
              <div
                className={cn(
                  "px-4 py-3 text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-500",
                )}
              >
                No matching products found
              </div>
            )}
          </div>

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleViewAllResults}
            className={cn(
              "w-full border-t px-4 py-3 text-left text-sm font-medium transition",
              theme === "dark"
                ? "border-gray-700 text-emerald-300 hover:bg-gray-800"
                : "border-gray-200 text-emerald-700 hover:bg-emerald-50",
            )}
          >
            View all results for "{trimmedSearchQuery}"
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter]",
        theme === "dark" ? "text-white" : "text-gray-900",
        isScrolled
          ? theme === "dark"
            ? "border-gray-800/90 bg-gray-950/78 shadow-xl shadow-black/10 backdrop-blur-xl"
            : "border-emerald-100/80 bg-white/85 shadow-lg shadow-emerald-950/5 backdrop-blur-xl"
          : theme === "dark"
            ? "border-transparent bg-gray-900/95"
            : "border-transparent bg-white/95",
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
            <Link
              href="/"
              className="flex items-center space-x-2 font-bold text-2xl text-emerald-600 transition hover:text-emerald-700"
            >
              <BrandLogo
                size={38}
                priority
                className="rounded-xl bg-white ring-1 ring-emerald-200 shadow-sm"
              />
              <span className="hidden sm:inline">GREEN</span>
            </Link>
          </motion.div>

          <div className="hidden items-center space-x-8 md:flex">
            <Link href="/" className={desktopLinkClass("/")}>
              Home
            </Link>
            <Link href="/products" className={desktopLinkClass("/products")}>
              Products
            </Link>
            {user?.is_admin && (
              <Link href="/admin" className={desktopLinkClass("/admin")}>
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <form
              onSubmit={handleSearch}
              className="hidden items-center md:flex"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholder="Search products..."
                  className={cn(
                    "w-52 rounded-xl border px-4 py-2 text-sm shadow-sm transition-[border-color,box-shadow,width] duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/25",
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800/90 text-white placeholder-gray-500 focus:border-emerald-500"
                      : "border-gray-300 bg-white text-gray-900 focus:border-emerald-500",
                  )}
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "absolute right-0 top-0 h-full px-3 cursor-pointer",
                    theme === "dark"
                      ? "text-gray-500 hover:text-emerald-400"
                      : "text-gray-400 hover:text-emerald-600",
                  )}
                >
                  <Search size={18} />
                </motion.button>

                {renderSearchDropdown()}
              </div>
            </form>

            <motion.button
              type="button"
              onClick={toggleTheme}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "relative z-10 rounded-xl p-2 transition cursor-pointer",
                theme === "dark"
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
              )}
              title="Toggle theme"
            >
              <motion.span
                key={theme}
                initial={{ rotate: -70, scale: 0.75, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={quickTransition}
                className="flex"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </motion.span>
            </motion.button>

            {user && (
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/wishlist"
                  className="relative block p-2 transition"
                >
                  <Heart
                    size={24}
                    className={
                      theme === "dark"
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-red-600"
                    }
                  />
                  <AnimatePresence>
                    {wishlistCount > 0 && (
                      <motion.span
                        key={wishlistCount}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{
                          type: "spring",
                          stiffness: 480,
                          damping: 24,
                        }}
                        className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                      >
                        {wishlistCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )}

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link href="/cart" className="relative block p-2 transition">
                <ShoppingCart
                  size={24}
                  className={
                    theme === "dark"
                      ? "text-gray-300 hover:text-emerald-400"
                      : "text-gray-700 hover:text-emerald-600"
                  }
                />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 26,
                      }}
                      className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => {
                const nextSearchOpen = !isSearchOpen;
                setIsSearchOpen(nextSearchOpen);

                if (!nextSearchOpen) {
                  setIsSearchDropdownOpen(false);
                }
              }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "relative z-10 p-2 transition cursor-pointer md:hidden",
                theme === "dark"
                  ? "text-gray-300 hover:text-emerald-400"
                  : "text-gray-700 hover:text-emerald-600",
              )}
            >
              <Search size={20} />
            </motion.button>

            {user ? (
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="hidden items-center space-x-2 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-gray-800 sm:flex"
                >
                  <UserIcon
                    size={16}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <span
                    className={cn(
                      "max-w-[120px] truncate text-sm font-medium",
                      theme === "dark" ? "text-gray-300" : "text-gray-700",
                    )}
                  >
                    {user.first_name || user.email}
                  </span>
                </motion.div>
                <div className="hidden items-center space-x-1 sm:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/profile")}
                    className="hidden sm:flex"
                  >
                    <UserIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="hidden sm:flex"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="hidden items-center space-x-2 md:flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/login")}
                >
                  Login
                </Button>
                <Button size="sm" onClick={() => router.push("/register")}>
                  Sign Up
                </Button>
              </div>
            )}

            <motion.button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "relative z-10 p-2 transition cursor-pointer md:hidden",
                theme === "dark"
                  ? "text-gray-300 hover:text-emerald-400"
                  : "text-gray-700 hover:text-emerald-600",
              )}
            >
              <motion.span
                key={isOpen ? "open" : "closed"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={quickTransition}
                className="flex"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isSearchOpen && (
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={quickTransition}
              className="overflow-hidden pb-4 md:hidden"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholder="Search products..."
                  className={cn(
                    "w-full rounded-xl border px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25",
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-emerald-500"
                      : "border-gray-300 bg-white text-gray-900 focus:border-emerald-500",
                  )}
                />
                <button
                  type="submit"
                  className={cn(
                    "absolute right-0 top-0 h-full px-3",
                    theme === "dark"
                      ? "text-gray-500 hover:text-emerald-400"
                      : "text-gray-400 hover:text-emerald-600",
                  )}
                >
                  <Search size={18} />
                </button>

                {renderSearchDropdown()}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={quickTransition}
              className={cn(
                "overflow-hidden md:hidden",
                theme === "dark" ? "border-gray-700" : "border-gray-200",
              )}
            >
              <motion.div
                variants={mobileMenuContainer}
                initial="hidden"
                animate="visible"
                className={cn(
                  "space-y-2 border-t pb-4 pt-4",
                  theme === "dark" ? "border-gray-700" : "border-gray-200",
                )}
              >
                <motion.div variants={mobileMenuItem}>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2 transition",
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-800 hover:text-emerald-400"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                    )}
                    onClick={closeMobilePanels}
                  >
                    <Home size={16} />
                    <span>Home</span>
                  </Link>
                </motion.div>

                <motion.div variants={mobileMenuItem}>
                  <Link
                    href="/products"
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2 transition",
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-800 hover:text-emerald-400"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                    )}
                    onClick={closeMobilePanels}
                  >
                    <Package2 size={16} />
                    <span>Products</span>
                  </Link>
                </motion.div>

                {user && (
                  <motion.div variants={mobileMenuItem}>
                    <Link
                      href="/wishlist"
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-2 transition",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-800 hover:text-emerald-400"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                      )}
                      onClick={closeMobilePanels}
                    >
                      <Heart size={16} />
                      <span>Wishlist</span>
                    </Link>
                  </motion.div>
                )}

                {user && (
                  <motion.div variants={mobileMenuItem}>
                    <Link
                      href="/profile"
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-2 transition",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-800 hover:text-emerald-400"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                      )}
                      onClick={closeMobilePanels}
                    >
                      <UserIcon size={16} />
                      <span>Profile</span>
                    </Link>
                  </motion.div>
                )}

                {user?.is_admin && (
                  <motion.div variants={mobileMenuItem}>
                    <Link
                      href="/admin"
                      className={cn(
                        "block rounded-xl px-4 py-2 transition",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-800 hover:text-emerald-400"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                      )}
                      onClick={closeMobilePanels}
                    >
                      Admin
                    </Link>
                  </motion.div>
                )}

                {user ? (
                  <motion.div variants={mobileMenuItem}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-4 py-2 text-left transition",
                        theme === "dark"
                          ? "text-red-400 hover:bg-gray-800"
                          : "text-red-600 hover:bg-red-50",
                      )}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={mobileMenuItem}
                    className={cn(
                      "space-y-2 border-t pt-2",
                      theme === "dark" ? "border-gray-700" : "border-gray-200",
                    )}
                  >
                    <Link
                      href="/login"
                      className={cn(
                        "block rounded-xl px-4 py-2 transition",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-800 hover:text-emerald-400"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                      )}
                      onClick={closeMobilePanels}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block rounded-xl bg-emerald-600 px-4 py-3 text-white transition hover:bg-emerald-700"
                      onClick={closeMobilePanels}
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
