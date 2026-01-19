'use client';

import { useState, useEffect } from 'react';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  const hasHeadings = headings && headings.length > 0;

  useEffect(() => {
    if (!hasHeadings) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings, hasHeadings]);

  // Don't render if no headings
  if (!hasHeadings) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  return (
    <>
      {/* Mobile: always visible list */}
      <nav className="toc-mobile xl:hidden mb-6" aria-label="Table of contents">
        <div className="toc-mobile-header">Contents</div>
        <ul className="toc-mobile-list">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className="toc-mobile-item"
              style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={`toc-mobile-link ${activeId === heading.id ? 'toc-mobile-link-active' : ''}`}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop: sticky sidebar on the right */}
      <nav className="toc-sidebar" aria-label="Table of contents">
        <div className="toc-sidebar-inner">
          <div className="toc-sidebar-header">Contents</div>
          <ul className="toc-sidebar-list">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className="toc-sidebar-item"
                style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`toc-sidebar-link ${activeId === heading.id ? 'toc-sidebar-link-active' : ''}`}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
