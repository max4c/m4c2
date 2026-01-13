'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MinimalHeader() {
  const pathname = usePathname() || '';
  const linkClass = (isActive: boolean) =>
    ['text-blue-600 dark:text-blue-400', isActive ? 'font-bold' : '']
      .filter(Boolean)
      .join(' ');
  
  return (
    <header className="w-full max-w-2xl mx-auto pt-6 px-4">
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[auto,1fr] sm:items-baseline sm:gap-x-6 sm:gap-y-2">
        <h3 className="text-xl font-bold leading-none">
          <Link href="/" className="text-black dark:text-white hover:no-underline">
            maxforsey.com
          </Link>
        </h3>
        <nav className="flex flex-wrap items-center justify-start gap-2 sm:justify-self-end sm:justify-end">
          <Link href="/" className={linkClass(pathname === '/')}>
            home
          </Link>
          <Link href="/blog" className={linkClass(pathname.startsWith('/blog'))}>
            blog
          </Link>
          <Link href="/wiki" className={linkClass(pathname.startsWith('/wiki'))}>
            wiki
          </Link>
          <Link href="/about" className={linkClass(pathname.startsWith('/about'))}>
            about
          </Link>
        </nav>
      </div>
    </header>
  );
} 
