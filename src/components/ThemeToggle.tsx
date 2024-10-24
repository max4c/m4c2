'use client';

import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      <Image
        src={theme === 'dark' ? '/makelight.svg' : '/makedark.svg'}
        alt="Theme toggle"
        width={24}
        height={24}
      />
    </button>
  );
}
