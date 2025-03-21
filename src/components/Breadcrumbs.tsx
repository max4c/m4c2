import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  homeHref?: string;
  className?: string;
}

export default function Breadcrumbs({ 
  items,
  homeHref = '/',
  className = '',
}: BreadcrumbsProps) {
  return (
    <nav className={`flex text-sm text-gray-500 dark:text-gray-400 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        <li>
          <Link 
            href={homeHref}
            className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <HomeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <Fragment key={index}>
            <li className="flex items-center">
              <ChevronRightIcon 
                className="h-4 w-4 flex-shrink-0 text-gray-400" 
                aria-hidden="true" 
              />
            </li>
            <li className="text-sm">
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
} 