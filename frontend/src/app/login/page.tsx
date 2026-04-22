"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { fadeUp, Stagger, scaleIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      toast.success("Logged in successfully!");
      router.push("/");
    } catch {
      // Error is already handled in the store.
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 py-12 transition-colors dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/70">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-emerald-100/80 blur-3xl dark:bg-emerald-500/20 animate-float-soft" />
        <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-green-100/80 blur-3xl dark:bg-green-500/20 animate-float-soft-delayed" />
      </div>

      <Stagger
        className="relative w-full max-w-md space-y-6"
        staggerChildren={0.1}
      >
        <motion.div variants={scaleIn(0.94)} className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Sparkles size={15} />
            Fast access to your account
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            Sign in to GREEN
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Continue shopping with smoother access to your orders, wishlist, and
            cart.
          </p>
        </motion.div>

        <motion.div variants={fadeUp(18)}>
          <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_24px_70px_-35px_rgba(16,185,129,0.35)] backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/85">
            <div className="relative h-2 overflow-hidden bg-gradient-to-r from-emerald-500 to-green-500">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-white/30 blur-2xl animate-shimmer-x" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-8">
              <motion.div variants={fadeUp(16)} className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-semibold text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeUp(18)} className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-semibold text-gray-700 dark:text-gray-300"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 pr-16 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-sm font-medium text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp(20)}
                className="text-right text-sm font-medium"
              >
                <a
                  href="/"
                  className="text-emerald-600 transition hover:text-emerald-700"
                >
                  Forgot password?
                </a>
              </motion.div>

              <motion.div variants={fadeUp(22)}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full rounded-xl"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  {!isLoading && <ArrowRight size={18} className="ml-2" />}
                </Button>
              </motion.div>
            </form>

            <div className="border-t border-gray-200 px-8 py-4 dark:border-gray-800">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-emerald-600 transition hover:text-emerald-700"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp(24)}>
          <Card className="border border-blue-200 bg-blue-50/90 p-6 shadow-sm backdrop-blur dark:border-blue-500/30 dark:bg-blue-500/10">
            <p className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-200">
              Demo Credentials
            </p>
            <div className="space-y-2 text-xs text-blue-800 dark:text-blue-300">
              <p>
                <strong>Email:</strong> demo@example.com
              </p>
              <p>
                <strong>Password:</strong> password123
              </p>
            </div>
          </Card>
        </motion.div>
      </Stagger>
    </div>
  );
}
