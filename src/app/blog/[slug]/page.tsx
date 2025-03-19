import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { MDXComponents as MDXComponentsType } from 'mdx/types';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import matter from 'gray-matter';
import { format, addMonths, parseISO } from 'date-fns';
import BlogPostHeader from '@/components/BlogPostHeader';
import Link from 'next/link';

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'src/app/blog', `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const { content, data } = matter(fileContent);
  const title = data.title || slug;
  const readTime = calculateReadTime(content);
  const formattedDate = data.date ? format(new Date(data.date), 'dd MMM yyyy') : '';
  const location = data.location || '';

  return (
    <article>
      <BlogPostHeader 
        title={title}
        type={data.type || 'post'}
        formattedDate={formattedDate}
        location={location}
        readTime={readTime}
      />
      <MDXContent>
        <MDXRemote
          source={content}
          components={MDXComponents as any}
        />
      </MDXContent>
      
      <div className="max-w-2xl mx-auto px-4 mt-8 pb-8 text-center">
        <Link 
          href="/blog"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to blog
        </Link>
      </div>
    </article>
  );
}
