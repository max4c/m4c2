"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../context/ThemeContext';
import SocialIcons from './SocialIcons';

const Footer = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <footer className="w-full">
      <div className="content-wrapper py-4">
        <hr className="border-gray-200 dark:border-gray-700 mb-4" />
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/" className="text-xl font-bold hover:text-gray-600 transition-colors">
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
