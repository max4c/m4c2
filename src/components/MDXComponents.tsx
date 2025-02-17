import Link from 'next/link';
import Iframe from './Iframe';
import LatexEquation from './LatexEquation';
import CopyButton from './CopyButton';
import React from 'react';
import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';
import Video from './Video';

const Pre = ({ children, ...props }: { children: React.ReactNode }) => {
  // Extract the code content from pre > code element
  const code = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === 'code'
  );

  if (!React.isValidElement(code)) {
    return <pre {...props}>{children}</pre>;
  }

  return (
    <pre {...props}>
      <CopyButton code={code.props.children as string} />
      {children}
    </pre>
  );
};

export const components = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-3xl font-bold mb-4">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-2">{children}</h2>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-6 space-y-2">{children}</ul>
  ),
  a: (props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => (
    <Link href={props.href || '#'} className="hover:text-[#e97319]">
      {props.children}
    </Link>
  ),
  pre: Pre,
  Iframe,
  LatexEquation,
  Video,
};

export default components;