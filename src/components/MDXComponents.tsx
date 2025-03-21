import { MDXComponents } from 'mdx/types';
import Video from './Video';
import Iframe from './Iframe';
import Link from 'next/link';
import Image from 'next/image';
import CopyButton from './CopyButton';
import React, { DetailedHTMLProps, HTMLAttributes } from 'react';
import LatexEquation from './LatexEquation';
import Table from './Table';
import MDXTable from './MDXTable';

// Types
type CodeProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  children?: React.ReactNode;
};

type ParagraphProps = DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;

// Helper to process inline code text
const processInlineCode = (text: string): string => {
  // Remove backticks and any extra whitespace
  return text.replace(/^[\s`]+|[\s`]+$/g, '');
};

const InlineCode = (props: CodeProps) => {
  const { children, className, ...rest } = props;
  
  // For code blocks with language specification
  if (className?.includes('language-')) {
    return <code {...props}>{children}</code>;
  }

  // For inline code
  const content = typeof children === 'string' 
    ? processInlineCode(children)
    : children;

  return (
    <code 
      {...rest}
      className="px-1.5 py-0.5 rounded font-mono text-sm bg-gray-100 dark:bg-gray-800"
    >
      {content}
    </code>
  );
};

const Paragraph = ({ children, ...rest }: ParagraphProps) => {
  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      // Split on backtick-wrapped content, but preserve the splits
      const parts = node.split(/(`[^`]+`)/);
      
      if (parts.length === 1) return node;

      return parts.map((part, index) => {
        // Check if this part is wrapped in backticks
        if (part.match(/^`[^`]+`$/)) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 rounded font-mono text-sm bg-gray-100 dark:bg-gray-800"
            >
              {processInlineCode(part)}
            </code>
          );
        }
        return part;
      });
    }

    if (React.isValidElement(node)) {
      const element = node as React.ReactElement;
      
      // Handle code elements
      if (element.type === 'code') {
        const codeProps = element.props as { children?: string };
        if (typeof codeProps.children === 'string') {
          return React.cloneElement(element, {
            ...element.props,
            children: processInlineCode(codeProps.children)
          } as React.HTMLAttributes<HTMLElement>);
        }
      }

      // Recursively process children of other elements
      if (element.props.children) {
        return React.cloneElement(element, {
          ...element.props,
          children: React.Children.map(element.props.children, child => 
            processNode(child)
          )
        });
      }
    }

    return node;
  };

  // Process all children
  const processedChildren = React.Children.map(children, child => 
    processNode(child)
  );

  return <p {...rest}>{processedChildren}</p>;
};

// Custom Image component that uses Next.js Image for optimization
function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  ...props
}: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
  // Handle undefined src (return null or empty div)
  if (!src) return null;
  
  // Convert string width/height to numbers if they exist
  const imgWidth = width ? Number(width) : 800;
  const imgHeight = height ? Number(height) : 600;
  
  // Check if the image is an external URL
  const isExternal = src.startsWith('http');
  
  if (isExternal) {
    // For external images, we still use Next.js Image but with different props
    return (
      <div className={`my-6 ${className || ''}`}>
        <Image
          src={src}
          alt={alt || ''}
          width={imgWidth}
          height={imgHeight}
          className="rounded-lg mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
          unoptimized={false}
        />
      </div>
    );
  }
  
  // For local images
  return (
    <div className={`my-6 ${className || ''}`}>
      <Image
        src={src}
        alt={alt || ''}
        width={imgWidth}
        height={imgHeight}
        className="rounded-lg mx-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}

export const components: MDXComponents = {
  Video,
  Iframe,
  Link,
  Image,
  code: InlineCode,
  p: Paragraph,
  h1: ({ children, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-3" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3" {...props}>{children}</h3>,
  h4: ({ children, ...props }) => <h4 className="text-lg font-bold mt-6 mb-2" {...props}>{children}</h4>,
  h5: ({ children, ...props }) => <h5 className="text-base font-bold mt-4 mb-2" {...props}>{children}</h5>,
  h6: ({ children, ...props }) => <h6 className="text-sm font-bold mt-4 mb-2" {...props}>{children}</h6>,
  pre: ({ children, ...props }) => {
    const childrenArray = React.Children.toArray(children);
    const code = childrenArray[0] as React.ReactElement;
    
    return (
      <div className="relative">
        <pre {...props}>{code}</pre>
        <CopyButton code={code.props.children} />
      </div>
    );
  },
  a: ({ href, ...props }: any) => {
    if (href?.startsWith('http')) {
      return <a href={href} target="_blank" rel="noopener noreferrer" {...props} className="text-blue-600 dark:text-blue-400 hover:underline" />
    }
    return <Link href={href} {...props} className="text-blue-600 dark:text-blue-400 hover:underline" />
  },
  img: OptimizedImage,
  LatexEquation,
  Table: MDXTable,
};