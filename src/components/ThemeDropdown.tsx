'use client';

import { useTheme } from 'next-themes';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useEffect, useState } from 'react';

export default function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />;
  }

  // Determine focus ring color based on current theme
  const focusRingClass = theme === "dark" 
    ? "focus:ring-[#F7C217]" // Yellow ring for dark mode
    : "focus:ring-[#0957D0]"; // Blue ring for light mode

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 ${focusRingClass}`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
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
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <circle cx="12" cy="12" r="11" className="stroke-[#0957D0] fill-none" strokeWidth="2"/>
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z" className="fill-[#0957D0]"/>
            </svg>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[200px] bg-white dark:bg-gray-800 rounded-md p-1 shadow-lg"
          sideOffset={5}
        >
          <DropdownMenu.Item
            className={`px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
              ${theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            onClick={() => setTheme('light')}
          >
            Light
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={`px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
              ${theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Dark
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={`px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
              ${theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            onClick={() => setTheme('system')}
          >
            System
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
