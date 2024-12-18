'use client';

import Link from 'next/link';
import { Post } from './page';

type BlogContentProps = {
  blogPosts: [string, Post[]][];
};

const BlogContent: React.FC<BlogContentProps> = ({ blogPosts }) => {
  return (
    <div className="w-full blog-content">
      {blogPosts.map(([monthYear, posts]) => (
        <div key={monthYear} className="mb-4 w-full">
          <h2 className="mb-2 w-full font-bold">{monthYear}</h2>
          <div className="space-y-2 w-full">
            {posts.map(post => (
              <div key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-[#0957D0] dark:text-[#F7C217] hover:text-[#e97319] dark:hover:text-[#e97319] transition-colors block w-full"
                >
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
