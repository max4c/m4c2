import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `
# robots.txt for maxforsey.com
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://www.maxforsey.com/sitemap.xml

# Private areas
Disallow: /api/
Disallow: /admin/
`.trim();

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 