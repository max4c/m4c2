import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';
import MDXContent from '@/components/MDXContent';
import { components as MDXComponents } from '@/components/MDXComponents';
import TableOfContents from '@/components/TableOfContents';
import { format } from 'date-fns';
import BlogPostHeader from '@/components/BlogPostHeader';
import Image from 'next/image';
import { getPostBySlug, getAllPosts, getSeriesNavigation } from '@/lib/blog';
import { extractHeadings } from '@/lib/headings';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import SeriesNavigation from '@/components/SeriesNavigation';
import SubscribeInput from '@/components/SubscribeInput';

// Generate static params for static generation
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
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
  
  if (!post.content) {
    notFound();
  }
  
  const isOngoing = post.type === 'ongoing';
  const seriesInfo = post.series ? getSeriesNavigation(post) : null;

  // Extract headings from MDX content (h2, h3, and h4)
  const headings = extractHeadings(post.content, 2, 4);
  
  const postDate = ensureDate(post.date);
  const formattedDate = format(postDate, 'MM/dd/yyyy');
  
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
      <JsonLd data={structuredData} />
      
      <BlogPostHeader
        title={post.title}
        type={post.type}
        formattedDate={!isOngoing ? formattedDate : undefined}
        location={post.location || ''}
        banner={post.type === 'project' ? undefined : post.banner}
      />
      
      
      {seriesInfo && seriesInfo.series && (
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <SeriesNavigation
            seriesName={seriesInfo.series.name}
            currentPart={post.series!.part}
            totalParts={seriesInfo.series.totalParts}
            prevPost={seriesInfo.prev}
            nextPost={seriesInfo.next}
          />
        </div>
      )}

      {headings.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <TableOfContents headings={headings} />
        </div>
      )}

      <MDXContent>
        <MDXRemote
          source={post.content}
          components={MDXComponents as any}
        />
      </MDXContent>
      
      {seriesInfo && seriesInfo.series && (
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <SeriesNavigation 
            seriesName={seriesInfo.series.name}
            currentPart={post.series!.part}
            totalParts={seriesInfo.series.totalParts}
            prevPost={seriesInfo.prev}
            nextPost={seriesInfo.next}
          />
        </div>
      )}
      
      <div className="max-w-2xl mx-auto px-4 mt-8 pb-8">
        <SubscribeInput />
      </div>
    </article>
  );
}
