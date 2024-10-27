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
        {children}
      </div>
    </div>
  );
}
