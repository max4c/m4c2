'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function MinimalThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="text-blue-600 dark:text-blue-400 flex space-x-1 text-sm">
      <button 
        onClick={() => setTheme('light')}
        className={theme === 'light' ? 'font-bold' : ''}
        aria-label="Light theme"
      >
        l
      </button>
      <span>/</span>
      <button 
        onClick={() => setTheme('dark')}
        className={theme === 'dark' ? 'font-bold' : ''}
        aria-label="Dark theme"
      >
        d
      </button>
      <span>/</span>
      <button 
        onClick={() => setTheme('system')}
        className={theme === 'system' ? 'font-bold' : ''}
        aria-label="System theme"
      >
        s
      </button>
    </div>
  );
} 