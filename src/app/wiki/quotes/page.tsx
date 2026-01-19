import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import { getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes | Wiki | Max Forsey',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki/quotes',
  },
};

export default async function WikiQuotesPage() {
  const post = getPostBySlug('quotes');
  if (!post?.content) {
    notFound();
  }

  const lastUpdatedDate = post.lastModified ? new Date(post.lastModified) : new Date(post.date);
  const lastUpdated = format(lastUpdatedDate, 'MM/dd/yyyy');

  return (
    <article>
      <BlogPostHeader title={post.title} type={post.type} banner={post.banner} lastUpdated={lastUpdated} />
      <MDXContent>
        <MDXRemote source={post.content} components={MDXComponents as any} />
      </MDXContent>
    </article>
  );
}
