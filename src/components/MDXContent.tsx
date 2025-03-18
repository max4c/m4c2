import React from 'react';

interface MDXContentProps {
  children: React.ReactNode;
}

const MDXContent: React.FC<MDXContentProps> = ({ children }) => {
  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mdx-content prose dark:prose-invert prose-a:text-blue-600 dark:prose-a:text-blue-400">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MDXContent;
