'use client';

import Image from 'next/image';
import MinimalHeader from './MinimalHeader';

interface BlogPostHeaderProps {
  title: string;
  type: string;
  formattedDate?: string;
  location?: string;
  banner?: string;
}

export default function BlogPostHeader({ title, type, formattedDate, location, banner }: BlogPostHeaderProps) {
  const bannerSrc = banner || "/images/blog-banners/banner.png";

  return (
    <>
      <MinimalHeader />

      <div className="w-full max-w-2xl mx-auto px-4 my-6">
        <Image 
          src={bannerSrc}
          alt={`${title} banner image`}
          width={1200}
          height={600}
          className="w-full object-cover rounded-md shadow-md"
          priority
        />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
      </div>
    </>
  );
}
