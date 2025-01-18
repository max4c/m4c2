"use client"

import React from 'react';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[650px]">
        <div className="px-4 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
