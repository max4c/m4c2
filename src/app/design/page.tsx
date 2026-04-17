import type { Metadata } from 'next';
import DesignHero from '@/components/design/DesignHero';

export const metadata: Metadata = {
  title: 'Design | Max Forsey',
  description: 'Design portfolio',
  alternates: {
    canonical: 'https://www.maxforsey.com/design',
  },
};

export default function DesignPage() {
  return <DesignHero />;
}
