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

// Helper to generate an ID from heading text
const generateHeadingId = (children: React.ReactNode): string => {
  const text = React.Children.toArray(children)
    .map(child => {
      if (typeof child === 'string') return child;
      if (React.isValidElement(child) && child.props.children) {
        return generateHeadingId(child.props.children);
      }
      return '';
    })
    .join('');

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

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
  width, // Allow overriding defaults from MDX if needed, but default to 600
  height, // Allow overriding defaults from MDX if needed, but default to 300
  className = '', // Allow passing other classes like rounded-lg etc.
  ...props
}: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
  // Handle undefined src (return null or empty div)
  if (!src) return null;
  
  // Set desired aspect ratio (2:1 like Projects page), allowing overrides
  const imgWidth = width ? Number(width) : 600;
  const imgHeight = height ? Number(height) : 300;
  
  // Check if the image is an external URL
  const isExternal = src.startsWith('http');
  
  // Render the Image directly, applying centering, max-width, and vertical spacing
  return (
    <Image
      src={src}
      alt={alt || ''}
      width={imgWidth}
      height={imgHeight}
      // Apply max-width directly, center with mx-auto, add vertical margin
      className={`max-w-xl mx-auto my-6 rounded-lg ${className || ''}`}
      unoptimized={isExternal ? false : undefined}
      {...props} // Pass down any other props from the <img> tag
    />
  );
}

export const components: MDXComponents = {
  Video,
  Iframe,
  Link,
  Image,
  code: InlineCode,
  p: Paragraph,
  h1: ({ children, id, ...props }) => {
    const headingId = id || generateHeadingId(children);
    return <h1 id={headingId} className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>;
  },
  h2: ({ children, id, ...props }) => {
    const headingId = id || generateHeadingId(children);
    return <h2 id={headingId} className="text-lg font-semibold mt-10 mb-3 text-gray-800 dark:text-gray-200" {...props}>{children}</h2>;
  },
  h3: ({ children, id, ...props }) => {
    const headingId = id || generateHeadingId(children);
    return <h3 id={headingId} className="text-base font-semibold mt-8 mb-2 text-gray-800 dark:text-gray-200" {...props}>{children}</h3>;
  },
  h4: ({ children, id, ...props }) => {
    const headingId = id || generateHeadingId(children);
    return <h4 id={headingId} className="text-sm font-semibold mt-6 mb-2 text-gray-700 dark:text-gray-300" {...props}>{children}</h4>;
  },
  h5: ({ children, id, ...props }) => {
    const headingId = id || generateHeadingId(children);
    return <h5 id={headingId} className="text-base font-bold mt-4 mb-2" {...props}>{children}</h5>;
  },
  h6: ({ children, id, ...props }) => {
    const headingId = id || generateHeadingId(children);
    return <h6 id={headingId} className="text-sm font-bold mt-4 mb-2" {...props}>{children}</h6>;
  },
  pre: ({ children, ...props }) => {
    const childrenArray = React.Children.toArray(children);
    // Check if the first child is a valid React element representing the <code> tag
    const codeElement = React.isValidElement(childrenArray[0]) ? childrenArray[0] : null;

    // Ensure we have a valid code element with props and children
    if (!codeElement || !codeElement.props || !codeElement.props.children) {
      // Fallback: Render the original pre tag if structure is unexpected
      return <pre {...props}>{children}</pre>; 
    }

    // Extract the actual code string
    const codeString = codeElement.props.children;

    return (
      // Use relative positioning for the wrapper
      <div className="relative group"> 
        {/* Render the original <pre> tag with its props */}
        <pre {...props}> 
           {/* Render the original children (the <code> element) */}
          {codeElement}
        </pre>
        {/* Position the CopyButton absolutely in the top-right corner */}
        {/* Make it appear on hover using group-hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Pass the extracted code string to the CopyButton */}
            <CopyButton code={codeString} /> 
        </div>
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