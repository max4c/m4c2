'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAmbience } from '@/components/AmbienceProvider';

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

export default function MinimalHeader() {
  const pathname = usePathname() || '';
  const { isPlaying, toggle } = useAmbience();
  const linkClass = (isActive: boolean) =>
    ['text-blue-600 dark:text-blue-400 hover:underline', isActive ? 'font-bold' : '']
      .filter(Boolean)
      .join(' ');

  return (
    <header className="w-full max-w-2xl mx-auto pt-6 px-4">
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[auto,1fr] sm:items-baseline sm:gap-x-6 sm:gap-y-2">
        <h3 className="text-xl font-bold leading-none">
          <Link href="/" className="text-black dark:text-white hover:no-underline inline-flex items-baseline gap-2">
            <Image
              src="/images/objects/about.jpeg"
              alt=""
              width={24}
              height={24}
              className="rounded-full translate-y-1"
            />
            maxforsey.com
          </Link>
        </h3>
        <nav className="flex flex-wrap items-center justify-start gap-3 sm:justify-self-end sm:justify-end">
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
          <button
            type="button"
            onClick={toggle}
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Pause ambience' : 'Play ambience'}
          >
            {isPlaying ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>
          <Link
            href="/subscribe"
            className="text-blue-600 dark:text-blue-400 px-2 py-0.5 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 transition-colors"
          >
            subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
} 
