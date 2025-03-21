import { Post } from '@/lib/blog';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SeriesNavigationProps {
  seriesName: string;
  currentPart: number;
  totalParts: number;
  prevPost: Post | null;
  nextPost: Post | null;
}

export default function SeriesNavigation({
  seriesName,
  currentPart,
  totalParts,
  prevPost,
  nextPost
}: SeriesNavigationProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-8 mb-6 bg-gray-50 dark:bg-gray-800">
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Series: 
        </span>
        <h3 className="text-lg font-semibold">
          {seriesName}
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Part {currentPart} of {totalParts}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        {prevPost ? (
          <Link 
            href={`/blog/${prevPost.slug}`}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            <span>
              Previous: {prevPost.title}
            </span>
          </Link>
        ) : (
          <div></div>
        )}
        
        {nextPost ? (
          <Link 
            href={`/blog/${nextPost.slug}`}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            <span>
              Next: {nextPost.title}
            </span>
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Link>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
} 