'use client';

import { useState } from 'react';
import Link from 'next/link';

type Post = {
  slug: string;
  title: string;
  date: Date;
  type: string;
};

interface BlogPaginationProps {
  posts: Post[];
}

export default function BlogPagination({ posts }: BlogPaginationProps) {
  const postsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  const visiblePosts = posts.slice(
    currentPage * postsPerPage, 
    (currentPage + 1) * postsPerPage
  );
  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
  return (
    <>
      <div className="space-y-2">
        {visiblePosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="custom-button block"
          >
            <div className="button-outter">
              <div className="button-inner">
                <span>{post.title}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 0}
            className={`custom-button ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Previous page"
          >
            <div className="button-outter">
              <div className="button-inner py-2 px-3">
                <span>←</span>
              </div>
            </div>
          </button>
          
          <span className="text-sm">
            {currentPage + 1} / {totalPages}
          </span>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages - 1}
            className={`custom-button ${currentPage === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Next page"
          >
            <div className="button-outter">
              <div className="button-inner py-2 px-3">
                <span>→</span>
              </div>
            </div>
          </button>
        </div>
      )}
    </>
  );
} 