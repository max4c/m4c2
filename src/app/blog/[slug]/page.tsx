import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import MDXContent from '@/components/MDXContent';
import * as MDXComponents from '@/components/MDXComponents';
import matter from 'gray-matter';
import { format, addMonths } from 'date-fns';
import Link from 'next/link';

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export async function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'src/app/blog');
  const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));
  return files.map(file => ({
    slug: file.replace('.mdx', ''),
  }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'src/app/blog', `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const { content, data } = matter(fileContent);
  const title = data.title || slug;
  const readTime = calculateReadTime(content);

  const formattedDate = data.date ? format(addMonths(new Date(data.date), 1), 'MMMM yyyy') : '';
  const location = data.location || '';

  return (
    <>
      <div className="mb-4">
        {data.type === 'ongoing' ? (
          <Link href="/" className="text-2xl font-bold hover:text-gray-600 transition-colors">
            Max Forsey
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold hover:text-gray-600 transition-colors">
              Max Forsey&apos;s
            </Link>
            <span className="text-2xl font-bold"> Blog</span>
          </div>
        )}
        <div className="border-b border-gray-300 my-2"></div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-500">
          {formattedDate && location ? `${formattedDate}, ${location} • ` : ''}
          {data.type !== 'ongoing' && (formattedDate && location ? ` ${readTime} min read` : `${readTime} min read`)}
        </p>
      </div>
      <MDXContent>
        <MDXRemote
          source={content}
          components={{
            ...MDXComponents,
            iframe: MDXComponents.Iframe
          }}
        />
      </MDXContent>
    </>
  );
}
