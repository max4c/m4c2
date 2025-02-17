'use client';

import { useEffect, useRef } from 'react';
import { CSSProperties } from 'react';

interface VideoProps {
  src: string;
  title?: string;
}

export default function Video({ src, title }: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }
  }, []);

  const videoStyle: CSSProperties = {
    outline: 'none',
    marginBottom: '-4px',
    borderRadius: '8px',
  };

  return (
    <div className="my-8 relative">
      <div 
        className="relative w-full overflow-hidden rounded-lg"
        style={{
          // This ensures the video player controls stay within rounded corners
          backgroundColor: '#000',
        }}
      >
        <video
          ref={videoRef}
          className="w-full"
          controls
          loop
          muted
          playsInline
          style={videoStyle}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      {title && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          {title}
        </p>
      )}
    </div>
  );
}