'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface BlogPostHeaderProps {
  title: string;
  type: string;
  formattedDate?: string;
  location?: string;
  banner?: string;
}

export default function BlogPostHeader({ title, type, formattedDate, location, banner }: BlogPostHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = '/blog';

  useEffect(() => {
    setMounted(true);
  }, []);

  const bannerSrc = banner || "/images/blog-banners/banner.png";

  return (
    <>
      <header className="w-full max-w-2xl mx-auto pt-6 px-4">
        <div>
          <h3 className="text-xl font-bold mb-4">
            <Link href="/" className="text-black dark:text-white hover:no-underline">
              maxforsey.com
            </Link>
          </h3>
          <div className="flex justify-between items-center mb-4">
            <nav className="flex space-x-4">
              <Link 
                href="/" 
                className="text-blue-600 dark:text-blue-400"
              >
                home
              </Link>
              <Link 
                href="/blog" 
                className="font-bold text-blue-600 dark:text-blue-400"
              >
                blog
              </Link>
              <Link 
                href="/about" 
                className="text-blue-600 dark:text-blue-400"
              >
                about
              </Link>
              <Link 
                href="/projects" 
                className="text-blue-600 dark:text-blue-400"
              >
                projects
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 my-6">
        <Image 
          src={bannerSrc}
          alt={`${title} banner image`}
          width={1200}
          height={600}
          className="w-full object-cover rounded-md shadow-md"
          priority
        />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
      </div>
    </>
  );
}
