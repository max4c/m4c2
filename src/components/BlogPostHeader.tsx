'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface BlogPostHeaderProps {
  title: string;
  type: string;
  formattedDate: string;
  location: string;
  readTime: number;
}

export default function BlogPostHeader({ title, type, formattedDate, location, readTime }: BlogPostHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  if (!mounted) {
    return (
      <div className="w-full border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[650px] mx-auto px-6">
          <div className="pt-6 pb-4 blog-header">
            <div className="flex items-center justify-between gap-2">
              <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[650px] mx-auto px-6">
          <div className="pt-6 pb-4 blog-header">
            <div className="flex items-center justify-between w-full">
              <Link 
                href="/" 
                className="text-[#0957D0] dark:text-[#F7C217] hover:text-[#e97319] dark:hover:text-[#e97319] transition-colors text-xl font-bold"
              >
                Max Forsey&apos;s Blog
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[650px] mx-auto px-6 mt-4">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-sm text-gray-500">
          {formattedDate && location ? `${formattedDate}, ${location} • ` : ''}
          {type !== 'ongoing' && (formattedDate && location ? ` ${readTime} min read` : `${readTime} min read`)}
        </p>
      </div>
    </>
  );
}
