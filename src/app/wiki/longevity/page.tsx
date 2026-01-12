import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import { getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Longevity | Wiki | Max Forsey',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki/longevity',
  },
};

export default async function WikiLongevityPage() {
  const post = getPostBySlug('longevity');
  if (!post?.content) {
    notFound();
  }

  return (
    <article>
      <BlogPostHeader title={post.title} type={post.type} banner={post.banner} />
      <MDXContent>
        <MDXRemote source={post.content} components={MDXComponents as any} />
      </MDXContent>
    </article>
  );
}
