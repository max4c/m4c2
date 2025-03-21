import { format } from 'date-fns';
import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import { getAllPosts } from '@/lib/blog';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Max Forsey',
  description: 'Thoughts on software development, machine learning, and more.',
  openGraph: {
    title: 'Blog | Max Forsey',
    description: 'Thoughts on software development, machine learning, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Max Forsey',
    description: 'Thoughts on software development, machine learning, and more.',
  },
  alternates: {
    canonical: 'https://www.maxforsey.com/blog',
  },
};

// This is a server component, so it's safe to use the blog.ts module
export default function BlogPage() {
  // Filter out posts with type "ongoing"
  const posts = getAllPosts().filter(post => post.type !== 'ongoing');
  
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        {/* Post list - simple chronological list */}
        <div className="space-y-5 mt-4">
          {posts.map((post) => (
            <div key={post.slug} className="flex items-baseline">
              <span className="text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">
                {format(post.date, 'dd MMM yyyy')}
              </span>
              <Link 
                href={`/blog/${post.slug}`} 
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                {post.title}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
