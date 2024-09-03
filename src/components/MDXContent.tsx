import React from 'react';

const MDXContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="prose dark:prose-invert max-w-none mdx-content text-black dark:text-white">
      {children}
    </div>
  );
};

export default MDXContent;