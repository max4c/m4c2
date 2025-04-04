'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import SubscribeButton from './SubscribeButton';

interface BlogPostHeaderProps {
  title: string;
  type: string;
  formattedDate?: string;
  location: string;
  readTime: number;
}

export default function BlogPostHeader({ title, type, formattedDate, location, readTime }: BlogPostHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = '/blog';

  useEffect(() => {
    setMounted(true);
  }, []);

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
            <SubscribeButton variant="link">
              subscribe
            </SubscribeButton>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {formattedDate && location ? `${formattedDate}, ${location}` : formattedDate}
        </p>
      </div>
    </>
  );
}
