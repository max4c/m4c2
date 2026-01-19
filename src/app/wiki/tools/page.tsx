import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogPostHeader from '@/components/BlogPostHeader';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import TableOfContents from '@/components/TableOfContents';
import { getPostBySlug } from '@/lib/blog';
import { extractHeadings } from '@/lib/headings';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
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

  // Extract headings from MDX content (h3 and h4)
  const headings = extractHeadings(post.content, 3, 4);

  const lastUpdatedDate = post.lastModified ? new Date(post.lastModified) : new Date(post.date);
  const lastUpdated = format(lastUpdatedDate, 'MM/dd/yyyy');

  return (
    <article>
      <BlogPostHeader
        title={post.title}
        type={post.type}
        banner={post.banner}
        lastUpdated={lastUpdated}
      />
      {headings.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-6">
          <TableOfContents headings={headings} />
        </div>
      )}
      <MDXContent>
        <MDXRemote source={post.content} components={MDXComponents as any} />
      </MDXContent>
    </article>
  );
}
