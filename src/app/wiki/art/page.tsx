import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import { getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Art | Wiki | Max Forsey',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki/art',
  },
};

export default async function WikiArtPage() {
  const music = getPostBySlug('music');
  const books = getPostBySlug('books');
  const films = getPostBySlug('films');

  if (!music?.content || !books?.content || !films?.content) {
    notFound();
  }

  return (
    <article>
      <BlogPostHeader title="Art" type="ongoing" banner={music.banner} />
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
