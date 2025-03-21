import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import { getAllPosts, getAllYears } from '@/lib/blog';
import { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Archives | Blog | Max Forsey',
  description: 'Browse blog posts by year and month',
};

export default function ArchivePage() {
  const years = getAllYears();
  const posts = getAllPosts();
  
  // Count posts per year
  const postCountByYear: Record<string, number> = {};
  years.forEach(year => {
    postCountByYear[year] = posts.filter(post => 
      post.date.getFullYear().toString() === year
    ).length;
  });
  
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Breadcrumbs 
            items={[
              { label: 'Blog', href: '/blog' },
              { label: 'Archives' }
            ]}
          />
          
          <h1 className="text-2xl font-bold mt-4 mb-2">Blog Archives</h1>
          
          <Link 
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to all posts
          </Link>
        </div>
        
        <div className="space-y-4">
          {years.map(year => (
            <div key={year} className="group">
              <Link href={`/blog/archive/${year}`}>
                <div className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <h2 className="text-xl font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {year}
                  </h2>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                    {postCountByYear[year]} {postCountByYear[year] === 1 ? 'post' : 'posts'}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
} 