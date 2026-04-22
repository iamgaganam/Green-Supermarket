"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export const baseTransition = {
  duration: 0.65,
  ease,
};

export const quickTransition = {
  duration: 0.35,
  ease,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: baseTransition,
  },
};

export const fadeUp = (distance = 24): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTransition,
  },
});

export const scaleIn = (scale = 0.96): Variants => ({
  hidden: { opacity: 0, scale },
  visible: {
    opacity: 1,
    scale: 1,
    transition: baseTransition,
  },
});

export const staggerContainer = (
  staggerChildren = 0.12,
  delayChildren = 0,
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

interface RevealProps extends PropsWithChildren {
  amount?: number;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  y?: number;
}

export function MotionProvider({ children }: PropsWithChildren) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({
  amount = 0.2,
  children,
  className,
  delay = 0,
  duration = 0.65,
  once = true,
  y = 24,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends PropsWithChildren {
  amount?: number;
  className?: string;
  delayChildren?: number;
  once?: boolean;
  staggerChildren?: number;
}

export function Stagger({
  amount = 0.18,
  children,
  className,
  delayChildren = 0,
  once = true,
  staggerChildren = 0.12,
}: StaggerProps) {
  return (
    <motion.div
      variants={staggerContainer(staggerChildren, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface PageTransitionProps extends PropsWithChildren {
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className={cn("min-h-full", className)}
    >
      {children}
    </motion.div>
  );
}
