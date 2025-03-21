'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SubscribeButton from './SubscribeButton';
import ThemeToggle from './ThemeToggle';

export default function MinimalHeader() {
  const pathname = usePathname() || '';
  const isBlogPage = pathname.startsWith('/blog');
  
  return (
    <header className="w-full max-w-2xl mx-auto pt-6 px-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            <Link href="/" className="text-black dark:text-white hover:no-underline">
              maxforsey.com
            </Link>
          </h3>
          <ThemeToggle />
        </div>
        <div className="flex justify-between items-center mb-4">
          <nav className="flex space-x-4">
            <Link 
              href="/" 
              className={pathname === '/' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}
            >
              home
            </Link>
            <Link 
              href="/blog" 
              className={pathname.startsWith('/blog') ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}
            >
              blog
            </Link>
            <Link 
              href="/about" 
              className={pathname.startsWith('/about') ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}
            >
              about
            </Link>
            <Link 
              href="/projects" 
              className={pathname.startsWith('/projects') ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}
            >
              projects
            </Link>
          </nav>
          {isBlogPage && (
            <SubscribeButton variant="link">
              subscribe
            </SubscribeButton>
          )}
        </div>
      </div>
    </header>
  );
} 