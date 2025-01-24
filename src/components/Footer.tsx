"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import SocialIcons from './SocialIcons';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';

const Footer = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return (
    <div className="w-full">
      <div className="content-wrapper">
        <footer className="mt-8 mb-8 p-4 sm:p-8 border border-black dark:border-white bg-white dark:bg-transparent">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/"
              className="text-xl text-[#0957D0] dark:text-[#F7C217] hover:text-[#e97319] dark:hover:text-[#e97319] transition-colors font-bold"
            >
              Max Forsey
            </Link>
            <div className="flex gap-4 sm:ml-auto items-center">
              <SocialIcons />
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Footer;
