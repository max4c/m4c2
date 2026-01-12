import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import type { Metadata } from 'next';

const WIKI_PAGES = [
  { title: 'Tools', href: '/wiki/tools' },
  { title: 'Quotes', href: '/wiki/quotes' },
  { title: 'Art', href: '/wiki/art' },
  { title: 'Longevity', href: '/wiki/longevity' },
  { title: 'Ambience', href: '/wiki/ambience' },
];

export const metadata: Metadata = {
  title: 'Wiki | Max Forsey',
  description: 'A small set of notes and lists.',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki',
  },
};

export default function WikiIndexPage() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="space-y-4 mt-4">
          {WIKI_PAGES.map((page) => (
            <div key={page.href}>
              <Link
                href={page.href}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {page.title}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
