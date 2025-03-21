import React from 'react';
import Link from 'next/link';

interface TagCloudProps {
  tags: {
    name: string;
    count: number;
  }[];
  maxSize?: number;
  minSize?: number;
}

const TagCloud: React.FC<TagCloudProps> = ({ 
  tags, 
  maxSize = 2, 
  minSize = 0.8 
}) => {
  if (!tags.length) return null;
  
  // Find the max and min counts
  const maxCount = Math.max(...tags.map(tag => tag.count));
  const minCount = Math.min(...tags.map(tag => tag.count));
  
  // Function to calculate font size based on count
  const calculateSize = (count: number): number => {
    if (maxCount === minCount) return (maxSize + minSize) / 2;
    
    // Linear interpolation between minSize and maxSize
    return minSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize);
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link
          key={tag.name}
          href={`/blog/tag/${encodeURIComponent(tag.name)}`}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          style={{ fontSize: `${calculateSize(tag.count)}rem` }}
        >
          <span>{tag.name}</span>
          <span className="ml-1 text-gray-500 dark:text-gray-400 text-xs align-super">
            {tag.count}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default TagCloud; 