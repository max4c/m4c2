import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import { format } from 'date-fns';
import BlogPostHeader from '@/components/BlogPostHeader';
import Link from 'next/link';
import { getPostBySlug, getAllPosts, getSeriesNavigation } from '@/lib/blog';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import SeriesNavigation from '@/components/SeriesNavigation';
import SubscribeButton from '@/components/SubscribeButton';

// Generate static params for static generation
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Calculate read time based on word count (average reading speed: 200 words per minute)
function calculateReadTime(content: string) {
  const wordCount = content.trim().split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  return readTime;
}

// Ensure date is always a Date object
function ensureDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  
  const websiteUrl = 'https://www.maxforsey.com';
  const canonicalUrl = `${websiteUrl}/blog/${post.slug}`;
  const postDate = ensureDate(post.date);
  
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: postDate.toISOString(),
      authors: ['Max Forsey'],
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      creator: '@maxforsey',
    },
    keywords: post.keywords,
    authors: [{ name: 'Max Forsey' }],
    // Add canonical URL metadata
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    notFound();
  }
  
  // Ensure content exists (TypeScript safety)
  if (!post.content) {
    notFound();
  }
  
  // Check if this is an ongoing post
  const isOngoing = post.type === 'ongoing';
  
  // Get series information if this post is part of a series
  const seriesInfo = post.series ? getSeriesNavigation(post) : null;
  
  const readTime = calculateReadTime(post.content);
  const postDate = ensureDate(post.date);
  const formattedDate = format(postDate, 'dd MMM yyyy');
  
  // Prepare JSON-LD structured data
  const websiteUrl = 'https://www.maxforsey.com';
  const articleUrl = `${websiteUrl}/blog/${post.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: 'Max Forsey',
      url: websiteUrl,
    },
    datePublished: postDate.toISOString(),
    dateModified: post.lastModified 
      ? ensureDate(post.lastModified).toISOString() 
      : postDate.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    keywords: post.keywords?.join(', ') || '',
    publisher: {
      '@type': 'Person',
      name: 'Max Forsey',
      url: websiteUrl,
    },
    url: articleUrl,
  };
  
  return (
    <article>
      {/* Add JSON-LD structured data */}
      <JsonLd data={structuredData} />
      
      <BlogPostHeader 
        title={post.title}
        type={post.type}
        formattedDate={!isOngoing ? formattedDate : undefined}
        location={post.location || ''}
        readTime={readTime}
      />
      
      {/* Display series navigation at the top if part of a series */}
      {seriesInfo && seriesInfo.series && (
        <div className="max-w-2xl mx-auto px-4">
          <SeriesNavigation 
            seriesName={seriesInfo.series.name}
            currentPart={post.series!.part}
            totalParts={seriesInfo.series.totalParts}
            prevPost={seriesInfo.prev}
            nextPost={seriesInfo.next}
          />
        </div>
      )}
      
      <MDXContent>
        <MDXRemote
          source={post.content}
          components={MDXComponents as any}
        />
      </MDXContent>
      
      {/* Display series navigation at the bottom if part of a series */}
      {seriesInfo && seriesInfo.series && (
        <div className="max-w-2xl mx-auto px-4">
          <SeriesNavigation 
            seriesName={seriesInfo.series.name}
            currentPart={post.series!.part}
            totalParts={seriesInfo.series.totalParts}
            prevPost={seriesInfo.prev}
            nextPost={seriesInfo.next}
          />
        </div>
      )}
      
      <div className="max-w-2xl mx-auto px-4 mt-8 pb-4 text-center">
        <div className="flex justify-center items-center space-x-4">
          <Link 
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← back to blog
          </Link>
          
          <span className="text-gray-300 dark:text-gray-600">•</span>
          
          <SubscribeButton variant="link">
            subscribe
          </SubscribeButton>
        </div>
      </div>
    </article>
  );
}
