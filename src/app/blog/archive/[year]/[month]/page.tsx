import { format } from 'date-fns';
import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import { getAllPosts, getPostsByYear } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

// Helper function to get all available year-month combinations
function getAllYearMonthCombinations() {
  const posts = getAllPosts();
  const combinations = new Set<string>();
  
  posts.forEach(post => {
    const year = post.date.getFullYear().toString();
    const month = format(post.date, 'MMM').toLowerCase();
    combinations.add(`${year}-${month}`);
  });
  
  return Array.from(combinations).map(combination => {
    const [year, month] = combination.split('-');
    return { year, month };
  });
}

// Generate static params for static generation
export async function generateStaticParams() {
  return getAllYearMonthCombinations();
}

// Helper function to format month name
function getMonthName(month: string): string {
  const monthNames: Record<string, string> = {
    'jan': 'January',
    'feb': 'February',
    'mar': 'March',
    'apr': 'April',
    'may': 'May',
    'jun': 'June',
    'jul': 'July',
    'aug': 'August',
    'sep': 'September',
    'oct': 'October',
    'nov': 'November',
    'dec': 'December'
  };
  return monthNames[month.toLowerCase()] || month.charAt(0).toUpperCase() + month.slice(1);
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { year: string, month: string } }): Promise<Metadata> {
  const { year, month } = params;
  const monthName = getMonthName(month);
  const websiteUrl = 'https://www.maxforsey.com';
  const canonicalUrl = `${websiteUrl}/blog/archive/${year}/${month}`;
  
  return {
    title: `${monthName} ${year} Archives | Blog | Max Forsey`,
    description: `Blog posts from ${monthName} ${year} by Max Forsey.`,
    openGraph: {
      title: `${monthName} ${year} Archives | Blog | Max Forsey`,
      description: `Blog posts from ${monthName} ${year} by Max Forsey.`,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${monthName} ${year} Archives | Blog | Max Forsey`,
      description: `Blog posts from ${monthName} ${year} by Max Forsey.`,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function MonthArchivePage({ params }: { params: { year: string, month: string } }) {
  const { year, month } = params;
  
  // Get posts for the year and filter by month
  const yearPosts = getPostsByYear(year);
  const posts = yearPosts.filter(post => 
    format(post.date, 'MMM').toLowerCase() === month.toLowerCase()
  );
  
  if (posts.length === 0) {
    notFound();
  }
  
  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Capitalize the first letter of the month for display
  const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Breadcrumbs 
            items={[
              { label: 'Blog', href: '/blog' },
              { label: year, href: `/blog/archive/${year}` },
              { label: formattedMonth }
            ]}
          />
          
          <h1 className="text-2xl font-bold mt-4 mb-2">
            {formattedMonth} {year} Archives
          </h1>
          
          <Link 
            href={`/blog/archive/${year}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to {year} archives
          </Link>
        </div>
        
        <div className="space-y-5">
          {sortedPosts.map((post) => (
            <div key={post.slug} className="flex items-baseline">
              <span className="text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
                {format(post.date, 'dd MMM')}
              </span>
              <div className="flex-1">
                <Link 
                  href={`/blog/${post.slug}`} 
                  className="hover:underline text-blue-600 dark:text-blue-400 font-medium"
                >
                  {post.title}
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {post.description.length > 120
                    ? post.description.substring(0, 120) + '...'
                    : post.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
} 