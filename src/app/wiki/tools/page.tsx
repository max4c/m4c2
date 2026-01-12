import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import { getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tools | Wiki | Max Forsey',
  alternates: {
    canonical: 'https://www.maxforsey.com/wiki/tools',
  },
};

export default async function WikiToolsPage() {
  const post = getPostBySlug('tools');
  if (!post?.content) {
    notFound();
  }

  return (
    <article>
      <BlogPostHeader
        title={post.title}
        type={post.type}
        banner={post.banner}
      />
      <MDXContent>
        <MDXRemote source={post.content} components={MDXComponents as any} />
      </MDXContent>
    </article>
  );
}
