"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../context/ThemeContext';
import SocialIcons from './SocialIcons';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <footer className="w-full">
      <div className="content-wrapper py-4">
        <hr className="border-gray-200 dark:border-gray-700 mb-4" />
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/"
            className="text-[#0957D0] dark:text-[#F7C217] hover:text-[#e97319] dark:hover:text-[#e97319] transition-colors font-bold"
          >
            Max Forsey
          </Link>
          <div className="flex gap-4 sm:ml-auto items-center">
            <SocialIcons />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
