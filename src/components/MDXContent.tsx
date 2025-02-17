import React from 'react';

interface MDXContentProps {
  children: React.ReactNode;
}

const MDXContent: React.FC<MDXContentProps> = ({ children }) => {
  return (
    <div className="w-full">
      <div className="max-w-[650px] mx-auto px-4 sm:px-8">
        <div className="mdx-content prose dark:prose-invert">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MDXContent;
