'use client';

import Image from 'next/image';
import MinimalHeader from './MinimalHeader';

interface BlogPostHeaderProps {
  title: string;
  type: string;
  formattedDate?: string;
  lastUpdated?: string;
  location?: string;
  banner?: string;
}

export default function BlogPostHeader({ title, type, formattedDate, lastUpdated, location, banner }: BlogPostHeaderProps) {
  return (
    <>
      <MinimalHeader />

      {banner && (
        <div className="w-full max-w-2xl mx-auto px-4 my-6">
          <Image
            src={banner}
            alt={`${title} banner image`}
            width={1200}
            height={600}
            className="w-full object-cover rounded-md shadow-md"
            priority
          />
        </div>
      )}

      <div className={`max-w-2xl mx-auto px-4 ${!banner ? 'mt-6' : ''}`}>
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        {formattedDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formattedDate}
          </p>
        )}
        {lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated {lastUpdated}
          </p>
        )}
        <hr className="mt-4 mb-6 border-gray-200 dark:border-gray-700" />
      </div>
    </>
  );
}
