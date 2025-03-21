import { format } from 'date-fns';
import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import { getAllYears, getPostsByYear } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

// Generate static params for static generation
export async function generateStaticParams() {
  const years = getAllYears();
  return years.map((year) => ({
    year,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { year: string } }): Promise<Metadata> {
  const { year } = params;
  const websiteUrl = 'https://www.maxforsey.com';
  const canonicalUrl = `${websiteUrl}/blog/archive/${year}`;
  
  return {
    title: `${year} Archives | Blog | Max Forsey`,
    description: `Blog posts from ${year} by Max Forsey.`,
    openGraph: {
      title: `${year} Archives | Blog | Max Forsey`,
      description: `Blog posts from ${year} by Max Forsey.`,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${year} Archives | Blog | Max Forsey`,
      description: `Blog posts from ${year} by Max Forsey.`,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function YearArchivePage({ params }: { params: { year: string } }) {
  const { year } = params;
  const posts = getPostsByYear(year);
  
  if (posts.length === 0) {
    notFound();
  }
  
  // Group posts by month
  const postsByMonth: Record<string, typeof posts> = {};
  
  posts.forEach(post => {
    const month = format(post.date, 'MMM').toLowerCase();
    if (!postsByMonth[month]) {
      postsByMonth[month] = [];
    }
    postsByMonth[month].push(post);
  });
  
  // Sort months in reverse order (most recent first)
  const months = Object.keys(postsByMonth).sort((a, b) => {
    const monthOrder = ['dec', 'nov', 'oct', 'sep', 'aug', 'jul', 'jun', 'may', 'apr', 'mar', 'feb', 'jan'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });
  
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Breadcrumbs 
            items={[
              { label: 'Blog', href: '/blog' },
              { label: `${year} Archives` }
            ]}
          />
          
          <h1 className="text-2xl font-bold mt-4 mb-2">{year} Archives</h1>
          
          <Link 
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to all posts
          </Link>
        </div>
        
        <div className="space-y-8">
          {months.map(month => (
            <div key={month} className="space-y-4">
              <h2 className="text-xl font-medium capitalize border-b border-gray-200 dark:border-gray-700 pb-1">
                <Link 
                  href={`/blog/archive/${year}/${month}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {month}
                </Link>
              </h2>
              
              <div className="space-y-3">
                {postsByMonth[month].map((post) => (
                  <div key={post.slug} className="flex items-baseline">
                    <span className="text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
                      {format(post.date, 'dd MMM')}
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
            </div>
          ))}
        </div>
      </main>
    </>
  );
} 