'use client';

import Script from 'next/script';

// Umami configuration
const UMAMI_SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function UmamiAnalytics() {
  // Don't render anything if configuration is missing
  if (!UMAMI_SCRIPT_URL || !UMAMI_WEBSITE_ID) return null;
  
  return (
    <Script
      src={UMAMI_SCRIPT_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
      // Recommended Umami settings
      data-auto-track="true"
      data-do-not-track="true"
      data-cache="true"
    />
  );
} 