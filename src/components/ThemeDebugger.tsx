"use client"

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeDebugger() {
  const { theme, resolvedTheme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("ThemeDebugger mounted");
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log({
        theme,
        resolvedTheme,
        systemTheme,
        docHasDarkClass: document.documentElement.classList.contains('dark'),
        systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
        localStorageTheme: localStorage.getItem('theme')
      });
    }
  }, [theme, resolvedTheme, systemTheme, mounted]);

  if (!mounted) return null;

  return null; // This component doesn't render anything
} 