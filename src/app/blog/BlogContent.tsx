'use client';

import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote';
import { components } from '@/components/MDXComponents';
import MinimalHeader from '@/components/MinimalHeader';

export default function BlogContent({ 
  source, 
  title, 
  date 
}: { 
  source: any; 
  title: string;
  date: Date;
}) {
  return (
    <>
      <MinimalHeader />
      <article className="w-full max-w-2xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          {date && (
            <p className="text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </header>
        <div className="prose dark:prose-invert prose-img:rounded-lg max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400">
          <MDXRemote {...source} components={components} />
        </div>
      </article>
    </>
  );
}
