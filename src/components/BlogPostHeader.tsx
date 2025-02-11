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
      <div className="w-full">
        <div className="max-w-[650px] mx-auto px-4 sm:px-8">
          <div className="pt-6 pb-4 blog-header border-b border-black dark:border-white">
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
      <div className="w-full">
        <div className="max-w-[650px] mx-auto px-4 sm:px-8">
          <div className="pt-6 pb-4 blog-header border-b border-black dark:border-white">
            <div className="flex items-center justify-between w-full">
              <Link 
                href="/" 
                className="custom-button"
              >
                <div className="button-outter">
                  <div className="button-inner">
                    <span>Max Forsey&apos;s Blog</span>
                  </div>
                </div>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[650px] mx-auto px-4 sm:px-8 mt-6 mb-6">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-sm text-gray-500">
          {formattedDate && location ? `${formattedDate}, ${location} • ` : ''}
          {type !== 'ongoing' && (formattedDate && location ? ` ${readTime} min read` : `${readTime} min read`)}
        </p>
      </div>
    </>
  );
}
