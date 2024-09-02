'use client';

import { useState } from 'react';
import Link from 'next/link';

type Post = {
  slug: string;
  title: string;
  type: string;
  date: Date;
};

type BlogContentProps = {
  blogPosts: [string, Post[]][];
  ongoingPosts: Post[];
};

export default function BlogContent({ blogPosts, ongoingPosts }: BlogContentProps) {
  const [showAllOngoing, setShowAllOngoing] = useState(false);

  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) + 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Blog Posts</h1>
      {blogPosts.map(([monthYear, posts]) => (
        <div key={monthYear}>
          <h2 className="text-xl font-semibold mt-6 mb-2">
            <span className="text-base">{formatDate(monthYear)}</span>
          </h2>
          <ul className="mb-8 space-y-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="hover:text-[#e97319] text-lg">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {/* Render ongoing posts here if needed */}
    </>
  );
}
