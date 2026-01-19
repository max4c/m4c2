import Link from 'next/link';

export default function MinimalFooter() {
  return (
    <footer className="w-full max-w-2xl mx-auto py-8 px-4">
      <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
          home
        </Link>
        <Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
          blog
        </Link>
        <Link href="/wiki" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
          wiki
        </Link>
        <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
          about
        </Link>
      </nav>
    </footer>
  );
}
