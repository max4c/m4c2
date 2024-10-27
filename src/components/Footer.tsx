"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import SocialIcons from './SocialIcons';
import ThemeDropdown from './ThemeDropdown';

const Footer = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <footer className="mt-8 w-full">
      <div className="content-border border-t">
        <div className="py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/"
              className="text-xl text-[#0957D0] dark:text-[#F7C217] hover:text-[#e97319] dark:hover:text-[#e97319] transition-colors font-bold"
            >
              Max Forsey
            </Link>
            <div className="flex gap-4 sm:ml-auto items-center">
              <SocialIcons />
              <ThemeDropdown />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
