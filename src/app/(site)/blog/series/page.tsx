import { Metadata } from 'next';
import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import { getAllSeries, getSeriesPosts } from '@/lib/blog';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Blog Series | Max Forsey',
  description: 'Multi-part blog post series on various topics including software development, machine learning, and more.',
  openGraph: {
    title: 'Blog Series | Max Forsey',
    description: 'Multi-part blog post series on various topics including software development, machine learning, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Series | Max Forsey',
    description: 'Multi-part blog post series on various topics including software development, machine learning, and more.',
  },
  alternates: {
    canonical: 'https://www.maxforsey.com/blog/series',
  },
};

export default function SeriesPage() {
  // Get all series from blog posts
  const allSeries = getAllSeries();
  
  // For each series, get the posts
  const seriesWithPosts = allSeries.map(series => ({
    ...series,
    posts: getSeriesPosts(series.name)
  }));
  
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-8 mt-4">
          <div className="gap-2 mb-4">
            <Link 
              href="/blog"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to blog
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Blog Series</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Collections of related posts organized into series
          </p>
          
          {seriesWithPosts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No series found. Check back later!
            </p>
          ) : (
            <div className="space-y-10">
              {seriesWithPosts.map(series => (
                <div key={series.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-semibold">{series.name}</h2>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {series.count} {series.count === 1 ? 'part' : 'parts'}
                  </p>
                  
                  <div className="space-y-2">
                    {series.posts.map(post => (
                      <div key={post.slug} className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-10">
                          Part {post.series!.part}:
                        </span>
                        <Link 
                          href={`/blog/${post.slug}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-2"
                        >
                          {post.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
} 