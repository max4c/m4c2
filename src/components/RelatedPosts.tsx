import Link from 'next/link';
import { format } from 'date-fns';
import { Post } from '@/lib/blog';

interface RelatedPostsProps {
  currentPost: Post;
  allPosts: Post[];
  maxPosts?: number;
}

export default function RelatedPosts({ 
  currentPost, 
  allPosts, 
  maxPosts = 3 
}: RelatedPostsProps) {
  if (!currentPost.tags || currentPost.tags.length === 0) {
    return null;
  }

  // Find posts that share tags with the current post
  const relatedPosts = allPosts
    .filter(post => 
      // Exclude current post
      post.slug !== currentPost.slug && 
      // Ensure posts have tags
      post.tags && 
      post.tags.length > 0 &&
      // Check if any tags match
      post.tags.some(tag => 
        currentPost.tags!.includes(tag)
      )
    )
    // Sort by number of matching tags (most relevant first)
    .sort((a, b) => {
      const aMatches = a.tags!.filter(tag => currentPost.tags!.includes(tag)).length;
      const bMatches = b.tags!.filter(tag => currentPost.tags!.includes(tag)).length;
      
      // If same number of matching tags, sort by date (newest first)
      if (bMatches === aMatches) {
        return b.date.getTime() - a.date.getTime();
      }
      
      return bMatches - aMatches;
    })
    // Limit to maxPosts
    .slice(0, maxPosts);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-semibold mb-4">Related Posts</h2>
      <div className="space-y-4">
        {relatedPosts.map(post => (
          <div key={post.slug} className="flex flex-col">
            <Link 
              href={`/blog/${post.slug}`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {post.title}
            </Link>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {format(post.date, 'dd MMM yyyy')}
            </div>
            {post.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {post.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 