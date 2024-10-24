'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface BlogPostHeaderProps {
  title: string;
  type: string;
  formattedDate: string;
  location: string;
  readTime: number;
}

export default function BlogPostHeader({ title, type, formattedDate, location, readTime }: BlogPostHeaderProps) {
  const { theme } = useTheme();
  
  return (
    <>
      <div className="pt-6 blog-header">
        <div className="flex items-center gap-2">
          {type === 'ongoing' ? (
            <div className="flex items-center gap-2">
              <Link href="/" className="text-2xl font-bold hover:text-gray-600 transition-colors">
                Max Forsey
              </Link>
              <ThemeToggle />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/" className="text-2xl font-bold hover:text-gray-600 transition-colors">
                Max Forsey&apos;s
              </Link>
              <span className="text-2xl font-bold">Blog</span>
              <ThemeToggle />
            </div>
          )}
          {type !== 'ongoing' && (
            <Link 
              href="/blog" 
              className="text-sm px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 
                        hover:border-gray-400 dark:hover:border-gray-500 
                        transition-all duration-200 ml-auto font-normal"
            >
              More Posts →
            </Link>
          )}
        </div>
      </div>
      <div className="border-b border-gray-300 dark:border-gray-700 my-2"></div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-gray-500">
        {formattedDate && location ? `${formattedDate}, ${location} • ` : ''}
        {type !== 'ongoing' && (formattedDate && location ? ` ${readTime} min read` : `${readTime} min read`)}
      </p>
    </>
  );
}
