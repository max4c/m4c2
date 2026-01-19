import MinimalHeader from '@/components/MinimalHeader';
import SubscribeInput from '@/components/SubscribeInput';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscribe | Max Forsey',
  description: 'Get new posts by email. 1-2x per month.',
  alternates: {
    canonical: 'https://www.maxforsey.com/subscribe',
  },
};

export default function SubscribePage() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4 mt-4">
        <div className="text-gray-600 dark:text-gray-400 mb-6 space-y-1">
          <p>I write about AI, design, and systems.</p>
          <p>New posts by email, 1-2x per month.</p>
          <p>No spam, unsubscribe anytime.</p>
        </div>

        <SubscribeInput />
      </main>
    </>
  );
}
