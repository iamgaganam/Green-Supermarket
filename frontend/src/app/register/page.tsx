"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
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

const benefits = [
  {
    icon: Sparkles,
    title: "Faster repeat orders",
    description:
      "Keep favourites, track orders, and move through checkout faster.",
  },
  {
    icon: Truck,
    title: "Cleaner delivery flow",
    description:
      "Manage groceries with a storefront built to feel smooth and reliable.",
  },
  {
    icon: Shield,
    title: "Secure account setup",
    description:
      "Protected sign-up flow with clear validation and responsive feedback.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      );
      toast.success("Account created successfully! Please log in.");
      router.push("/login");
    } catch {
      // Error is already handled in the store.
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 py-12 transition-colors dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/70">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-green-100/80 blur-3xl dark:bg-green-500/20 animate-float-soft" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-100/80 blur-3xl dark:bg-emerald-500/20 animate-float-soft-delayed" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <Stagger className="hidden lg:block space-y-6" staggerChildren={0.1}>
          <motion.div variants={scaleIn(0.94)}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles size={15} />
              Join in a minute
            </div>
            <h1 className="max-w-md text-5xl font-bold leading-tight text-gray-900 dark:text-white">
              Create your GREEN account and keep shopping moving.
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Register once, save your progress, and make grocery ordering feel
              lighter every time you come back.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <motion.div key={benefit.title} variants={fadeUp(18)}>
                  <Card className="border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {benefit.title}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Stagger>

        <Stagger className="w-full" staggerChildren={0.08}>
          <motion.div
            variants={scaleIn(0.94)}
            className="text-center lg:hidden"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles size={15} />
              Join in a minute
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Join GREEN
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create your account and start shopping with a smoother flow.
            </p>
          </motion.div>

          <motion.div variants={fadeUp(18)}>
            <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_24px_70px_-35px_rgba(16,185,129,0.35)] backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/85">
              <div className="relative h-2 overflow-hidden bg-gradient-to-r from-emerald-500 to-green-500">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-white/30 blur-2xl animate-shimmer-x" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-8">
                <motion.div
                  variants={fadeUp(16)}
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="font-semibold text-gray-700 dark:text-gray-300"
                    >
                      First Name
                    </Label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                        placeholder="John"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Last Name
                    </Label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                        placeholder="Doe"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp(18)} className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                      placeholder="you@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={fadeUp(20)}
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                        placeholder="At least 6 characters"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <CheckCircle2
                        className="absolute left-3 top-3 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="h-11 rounded-xl border-gray-200 bg-white/90 pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
                        placeholder="Repeat your password"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={fadeUp(22)}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                >
                  Use at least 6 characters so your account is easier to keep
                  secure.
                </motion.div>

                <motion.div variants={fadeUp(24)}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="w-full rounded-xl"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    {!isLoading && <ArrowRight size={18} className="ml-2" />}
                  </Button>
                </motion.div>
              </form>
            </Card>
          </motion.div>

          <motion.p
            variants={fadeUp(26)}
            className="text-center text-gray-600 dark:text-gray-400"
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-600 transition hover:text-emerald-700"
            >
              Sign in
            </Link>
          </motion.p>
        </Stagger>
      </div>
    </div>
  );
}
