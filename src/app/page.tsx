import MinimalHeader from '@/components/MinimalHeader';
import SubscribeInput from '@/components/SubscribeInput';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <p className="text-lg pt-1 mt-4 mb-4">
          I like to research AI and build helpful tools
        </p>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 flex-shrink">
            <a href="mailto:hello@maxforsey.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              email
            </a>
            <Link href="https://github.com/max4c" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
              git
            </Link>
            <Link href="https://x.com/max_4c" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
              x
            </Link>
            <Link href="https://linkedin.com/in/max-forsey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
              in
            </Link>
          </div>
          
          <div className="max-w-xs flex-shrink-0">
            <SubscribeInput />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Too busy to check out the website I worked so hard on? Give the entire website to an LLM{' '}
          <a
            href="https://uithub.com/max4c/m4c2"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-900 dark:hover:text-gray-100"
          >
            here
          </a>
          .
        </div>
      </main>
    </>
  );
}
