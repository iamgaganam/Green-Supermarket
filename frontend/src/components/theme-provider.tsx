"use client";

import { useLayoutEffect } from "react";
import { useThemeStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useLayoutEffect(() => {
    const html = document.documentElement;
    const isDark = theme === "dark";
    html.classList.toggle("dark", isDark);
    html.style.colorScheme = isDark ? "dark" : "light";
  }, [theme]);

  return <>{children}</>;
}
