import Link from 'next/link';
import Iframe from './Iframe';
import LatexEquation from './LatexEquation';

export const H1 = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-3xl font-bold mb-4">{children}</h1>
);

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-semibold mt-6 mb-2">{children}</h2>
);

export const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4">{children}</p>
);

export const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-5 mb-6 space-y-2">{children}</ul>
);

export const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="hover:text-[#e97319]">
    {children}
  </Link>
);

export { Iframe, LatexEquation };