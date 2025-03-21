import { format } from 'date-fns';
import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';
import { getAllTags, getPostsByTag } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Generate static params for static generation
export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({
    tag,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const websiteUrl = 'https://www.maxforsey.com';
  const canonicalUrl = `${websiteUrl}/blog/tag/${params.tag}`;
  
  return {
    title: `${tag} | Blog | Max Forsey`,
    description: `Blog posts about ${tag.toLowerCase()} by Max Forsey.`,
    openGraph: {
      title: `${tag} | Blog | Max Forsey`,
      description: `Blog posts about ${tag.toLowerCase()} by Max Forsey.`,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tag} | Blog | Max Forsey`,
      description: `Blog posts about ${tag.toLowerCase()} by Max Forsey.`,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const { tag } = params;
  const formattedTag = tag.replace('-', ' ');
  const posts = getPostsByTag(tag);
  
  if (posts.length === 0) {
    notFound();
  }
  
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Articles tagged: {formattedTag}</h1>
          <Link 
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to all posts
          </Link>
        </div>
        
        <div className="space-y-5">
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