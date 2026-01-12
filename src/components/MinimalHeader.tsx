'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MinimalHeader() {
  const pathname = usePathname() || '';
  const linkClass = (isActive: boolean) =>
    [
      'text-blue-600 dark:text-blue-400',
      isActive ? 'font-bold' : '',
    ]
      .filter(Boolean)
      .join(' ');
  
  return (
    <header className="w-full max-w-2xl mx-auto pt-6 px-4">
      <div>
        <h3 className="text-xl font-bold mb-4">
          <Link href="/" className="text-black dark:text-white hover:no-underline">
            maxforsey.com
          </Link>
        </h3>
        <div className="flex justify-between items-center mb-4">
          <nav className="flex flex-wrap items-center gap-2">
            <Link 
              href="/" 
              className={linkClass(pathname === '/')}
            >
              home
            </Link>
            <span className="opacity-30">·</span>
            <Link 
              href="/blog" 
              className={linkClass(pathname.startsWith('/blog'))}
            >
              blog
            </Link>
            <span className="opacity-30">·</span>
            <Link 
              href="/wiki" 
              className={linkClass(pathname.startsWith('/wiki'))}
            >
              wiki
            </Link>
            <span className="opacity-30">·</span>
            <Link 
              href="/about" 
              className={linkClass(pathname.startsWith('/about'))}
            >
              about
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 
