import MinimalHeader from '@/components/MinimalHeader';
import SubscribeInput from '@/components/SubscribeInput';
import Link from 'next/link';
import { execSync } from 'child_process';

async function getLastCommitDate() {
  try {
    const date = execSync('git log -1 --format="%ci"', { encoding: 'utf-8' }).trim();
    const commitDate = new Date(date);
    return commitDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Unknown';
  }
}

export default async function Home() {
  const lastUpdated = await getLastCommitDate();
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
          last updated: {lastUpdated}
        </div>
      </main>
    </>
  );
}
