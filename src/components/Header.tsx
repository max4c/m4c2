"use client";

import Image from "next/image";
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function Header() {
  const { isDarkMode, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [imageSrc, setImageSrc] = useState("/light-header.png");

  useEffect(() => {
    setImageSrc(isDarkMode ? "/dark-header.png" : "/light-header.png");
  }, [isDarkMode]);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="text-inherit header w-full">
      <header className="content-wrapper">
        <Link href="/" className="text-inherit hover:text-gray-300">
          <Image 
            src={imageSrc}
            alt="Artistic header image" 
            width={1200} 
            height={300} 
            className="w-full object-cover aspect-[4/1] object-top cursor-pointer rounded-lg"
          />
        </Link>
        <nav className="flex justify-center items-center my-2">
          <div className="flex flex-wrap justify-center items-center space-x-4 sm:space-x-20">
            <Link href="/" className={`px-2 py-1 rounded-md hover:text-[#e97319] ${isActive('/') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>Home</Link>
            <Link href="/blog" className={`px-2 py-1 rounded-md hover:text-[#e97319] ${isActive('/blog') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>Blog</Link>
            <Link href="/work" className={`px-2 py-1 rounded-md hover:text-[#e97319] ${isActive('/work') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>Work</Link>
            <button onClick={toggleTheme} className="focus:outline-none">
              <Image src="/toggle-mode.png" alt="Toggle theme" width={35} height={35} />
            </button>
          </div>
        </nav>
        <hr className="border-black dark:border-white my-2" />
      </header>
    </div>
  );
}