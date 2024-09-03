'use client';

import Link from 'next/link';
import { Post } from './page';

type BlogContentProps = {
  blogPosts: [string, Post[]][];
};

const BlogContent: React.FC<BlogContentProps> = ({ blogPosts }) => {
  return (
    <div className="text-base">
      <h1 className="text-2xl font-bold mb-4">Blog Posts</h1>
      
      {blogPosts.map(([monthYear, posts]) => (
        <div key={monthYear} className="mb-6">
          <h2 className="mb-2">{monthYear}</h2>
          <div className="space-y-2">
            {posts.map(post => (
              <div key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="text-lg hover:text-[#e97319] blog-link">
                  {post.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlogContent;
