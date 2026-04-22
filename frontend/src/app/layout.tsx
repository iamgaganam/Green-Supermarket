import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import BrandLogo from "@/components/brand-logo";
import { InitializeAuth } from "@/components/initialize-auth";
import { MotionProvider, PageTransition } from "@/components/motion";
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GREEN Supermarket - Fresh Groceries Online",
  description:
    "Shop fresh groceries, organic products, and pantry essentials online with GREEN Supermarket. Fast delivery, secure payments, and 24/7 customer support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
        <InitializeAuth />
        <ThemeProvider>
          <MotionProvider>
            <Navbar />
            <PageTransition>
              <main className="relative flex-1 overflow-x-clip bg-gray-50 dark:bg-gray-900 transition-colors">
                {children}
              </main>
            </PageTransition>
            <Toaster />

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-black text-white transition-colors">
              <div className="max-w-7xl mx-auto px-4 pt-16 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
                  {/* Brand */}
                  <div>
                    <div className="flex items-center space-x-2 font-bold text-2xl text-emerald-400 mb-4">
                      <BrandLogo
                        size={42}
                        className="rounded-xl bg-white ring-1 ring-emerald-200/70"
                      />
                      <span>GREEN</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Your trusted online supermarket for quality products and
                      fresh groceries delivered to your doorstep.
                    </p>
                  </div>

                  {/* Shopping */}
                  <div>
                    <h4 className="text-lg font-semibold mb-6 text-white">
                      Shopping
                    </h4>
                    <ul className="space-y-3 text-gray-400 text-sm">
                      <li>
                        <a
                          href="/products"
                          className="hover:text-emerald-400 transition"
                        >
                          All Products
                        </a>
                      </li>
                      <li>
                        <a
                          href="/products"
                          className="hover:text-emerald-400 transition"
                        >
                          Fresh Produce
                        </a>
                      </li>
                      <li>
                        <a
                          href="/products"
                          className="hover:text-emerald-400 transition"
                        >
                          Organic Items
                        </a>
                      </li>
                      <li>
                        <a
                          href="/products"
                          className="hover:text-emerald-400 transition"
                        >
                          Pantry Essentials
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Support */}
                  <div>
                    <h4 className="text-lg font-semibold mb-6 text-white">
                      Support
                    </h4>
                    <ul className="space-y-3 text-gray-400 text-sm">
                      <li>
                        <a
                          href="/general-feedback"
                          className="hover:text-emerald-400 transition"
                        >
                          Contact Us
                        </a>
                      </li>
                      <li>
                        <a
                          href="/"
                          className="hover:text-emerald-400 transition"
                        >
                          FAQ
                        </a>
                      </li>
                      <li>
                        <a
                          href="/orders"
                          className="hover:text-emerald-400 transition"
                        >
                          Shipping Info
                        </a>
                      </li>
                      <li>
                        <a
                          href="/orders"
                          className="hover:text-emerald-400 transition"
                        >
                          Track Order
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Company */}
                  <div>
                    <h4 className="text-lg font-semibold mb-6 text-white">
                      Company
                    </h4>
                    <ul className="space-y-3 text-gray-400 text-sm">
                      <li>
                        <a
                          href="/"
                          className="hover:text-emerald-400 transition"
                        >
                          About Us
                        </a>
                      </li>
                      <li>
                        <a
                          href="/"
                          className="hover:text-emerald-400 transition"
                        >
                          Careers
                        </a>
                      </li>
                      <li>
                        <a
                          href="/"
                          className="hover:text-emerald-400 transition"
                        >
                          Privacy Policy
                        </a>
                      </li>
                      <li>
                        <a
                          href="/"
                          className="hover:text-emerald-400 transition"
                        >
                          Terms of Service
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <p className="text-gray-400 text-sm">
                      &copy; 2026 GREEN Supermarket. All rights reserved.{" "}
                      Developed by{" "}
                      <a
                        href="https://iamgaganam.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sky-300 underline underline-offset-4 decoration-sky-400/70 hover:text-sky-200 hover:decoration-sky-300 transition"
                      >
                        Gagana Methmal
                      </a>
                      .
                    </p>
                    <div className="flex gap-6 md:justify-end">
                      <a
                        href="https://www.facebook.com/"
                        className="text-gray-400 hover:text-emerald-400 transition text-sm"
                      >
                        Facebook
                      </a>
                      <a
                        href="https://x.com/"
                        className="text-gray-400 hover:text-emerald-400 transition text-sm"
                      >
                        Twitter
                      </a>
                      <a
                        href="https://www.instagram.com/"
                        className="text-gray-400 hover:text-emerald-400 transition text-sm"
                      >
                        Instagram
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
