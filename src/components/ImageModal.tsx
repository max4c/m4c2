'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  scaleFactor?: number;
}

export default function ImageModal({ src, alt, width, height, scaleFactor = 2 }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpen = () => {
    document.body.style.overflow = 'hidden';
    setIsOpen(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('backdrop')) {
      document.body.style.overflow = 'unset';
      setIsOpen(false);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Calculate dimensions for the modal image using the scaleFactor
  const modalWidth = Math.min(width * scaleFactor, windowSize.width * 0.95);
  const modalHeight = (modalWidth / width) * height;

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
            priority
          />
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop p-4"
          onClick={handleClose}
        >
          <div className="relative">
            <div className="max-w-[95vw] max-h-[95vh]">
              <Image
                src={src}
                alt={alt}
                width={modalWidth}
                height={modalHeight}
                className="object-contain"
                priority
                quality={100}
              />
            </div>
            <button
              onClick={() => {
                document.body.style.overflow = 'unset';
                setIsOpen(false);
              }}
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
