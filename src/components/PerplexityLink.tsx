'use client';

import React, { useEffect, useRef } from 'react';

export default function PerplexityLink() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      const currentPageUrl = window.location.href;
      const promptText = `summarize ${currentPageUrl} in the following formats: technical, ELI5, and takeaways`;
      const encodedPrompt = encodeURIComponent(promptText);
      const perplexityUrl = `https://perplexity.ai/?q=${encodedPrompt}`;
      window.open(perplexityUrl, '_blank', 'noopener,noreferrer');
    };

    const linkElement = linkRef.current;
    if (linkElement) {
      linkElement.addEventListener('click', handleClick);
    }

    // Cleanup function to remove the event listener
    return () => {
      if (linkElement) {
        linkElement.removeEventListener('click', handleClick);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <a 
      ref={linkRef}
      href="#" // href is still needed for semantics, but prevented by JS
      target="_blank" // Good practice, though window.open handles the target
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ease-in-out"
      title="Summarize this post with Perplexity AI"
    >
      <span className="italic pr-0.5 text-left">TikTok level attention span? Get a summary</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit"><path d="M12 5a3 3 0 1 0-5.997.004A3 3 0 0 0 12 5Z"/><path d="M12 19a3 3 0 1 0 5.998-.005 3.002 3.002 0 0 0-6-.003Z"/><path d="M6 12a3 3 0 1 0 .003 5.998A3 3 0 0 0 6 12Z"/><path d="M18 12a3 3 0 1 0-.003-5.997A3 3 0 0 0 18 12Z"/><path d="M12 9.01V8M6.01 15H5M18.01 9H19M12 16.01V15M9.007 12.004H7.993M16.007 11.996H14.993"/></svg>
    </a>
  );
} 