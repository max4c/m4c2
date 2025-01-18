'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function ImageModal({ src, alt, width, height }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('backdrop')) {
      setIsOpen(false);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">
        <div className="border border-black dark:border-white p-2">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="w-full h-auto"
            onLoad={handleImageLoad}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center italic">
          Click to view larger version
        </p>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop"
          onClick={handleClose}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
              priority
              quality={100}
              onLoad={handleImageLoad}
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-900 p-2 rounded-full border border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
