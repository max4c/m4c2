'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      <Image
        src={theme === 'dark' ? '/light.svg' : '/dark.svg'}
        alt="Theme toggle"
        width={24}
        height={24}
      />
    </button>
  );
}