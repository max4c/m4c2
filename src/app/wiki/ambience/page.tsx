import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ambience | Wiki | Max Forsey',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki/ambience',
  },
};

export default function WikiAmbiencePage() {
  return (
    <article>
      <BlogPostHeader title="Ambience" type="page" />
      <MDXContent>
        <p>
          A small layer of atmosphere for the site. The bird on the home orbit links here.
        </p>
        <p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            back home
          </Link>
        </p>
      </MDXContent>
    </article>
  );
}
