"use client";

import { ThemeProvider } from "@/context/ThemeContext";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}