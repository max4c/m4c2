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

export const components: MDXComponents = {
  Video,
  Iframe,
  Link,
  Image,
  code: InlineCode,
  p: Paragraph,
  h1: ({ children, ...props }) => <h4 className="text-xl font-bold my-4" {...props}>{children}</h4>,
  h2: ({ children, ...props }) => <h4 className="text-xl font-bold my-4" {...props}>{children}</h4>,
  h3: ({ children, ...props }) => <h4 className="text-xl font-bold my-4" {...props}>{children}</h4>,
  h4: ({ children, ...props }) => <h4 className="text-xl font-bold my-4" {...props}>{children}</h4>,
  h5: ({ children, ...props }) => <h4 className="text-xl font-bold my-4" {...props}>{children}</h4>,
  h6: ({ children, ...props }) => <h4 className="text-xl font-bold my-4" {...props}>{children}</h4>,
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
  img: ({ src, alt, ...props }: any) => (
    <div className="relative w-full my-8">
      <Image
        {...props}
        src={src}
        alt={alt || ''}
        width={800}
        height={500}
        className="rounded-lg mx-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  ),
  LatexEquation,
  Table: MDXTable,
};