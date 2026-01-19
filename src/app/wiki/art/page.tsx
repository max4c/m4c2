import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import TableOfContents from '@/components/TableOfContents';
import { getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Art | Wiki | Max Forsey',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki/art',
  },
};

const HEADINGS = [
  { id: 'music', text: 'Music', level: 2 },
  { id: 'books', text: 'Books', level: 2 },
  { id: 'films', text: 'Films', level: 2 },
];

export default async function WikiArtPage() {
  const music = getPostBySlug('music');
  const books = getPostBySlug('books');
  const films = getPostBySlug('films');

  if (!music?.content || !books?.content || !films?.content) {
    notFound();
  }

  // Get the most recent lastModified date from all posts
  const dates = [music, books, films]
    .map((p) => p.lastModified ? new Date(p.lastModified) : new Date(p.date))
    .sort((a, b) => b.getTime() - a.getTime());
  const lastUpdated = format(dates[0], 'MM/dd/yyyy');

  return (
    <article>
      <BlogPostHeader title="Art" type="ongoing" banner={music.banner} lastUpdated={lastUpdated} />
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <TableOfContents headings={HEADINGS} />
      </div>
      <MDXContent>
        <h2 id="music">Music</h2>
        <MDXRemote source={music.content} components={MDXComponents as any} />

        <h2 id="books">Books</h2>
        <MDXRemote source={books.content} components={MDXComponents as any} />

        <h2 id="films">Films</h2>
        <MDXRemote source={films.content} components={MDXComponents as any} />
      </MDXContent>
    </article>
  );
}
