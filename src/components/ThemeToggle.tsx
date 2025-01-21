'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors duration-200"
    >
      {theme === 'light' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <circle cx="12" cy="12" r="11" className="stroke-[#0957D0] fill-none" strokeWidth="2"/>
          <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z" className="fill-[#0957D0]"/>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="6" className="fill-[#F7C217]"/>
          <g className="stroke-[#F7C217]" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="3" x2="12" y2="1"/>
            <line x1="12" y1="23" x2="12" y2="21"/>
            <line x1="3" y1="12" x2="1" y2="12"/>
            <line x1="23" y1="12" x2="21" y2="12"/>
            <line x1="5.636" y1="5.636" x2="4.222" y2="4.222"/>
            <line x1="19.778" y1="19.778" x2="18.364" y2="18.364"/>
            <line x1="18.364" y1="5.636" x2="19.778" y2="4.222"/>
            <line x1="4.222" y1="19.778" x2="5.636" y2="18.364"/>
          </g>
        </svg>
      )}
    </button>
  );
}
