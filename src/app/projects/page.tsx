import MinimalHeader from '@/components/MinimalHeader';
import Link from 'next/link';
import Image from 'next/image';

export default function ProjectsPage() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold mb-4">projects</h2>
        <div className="space-y-8">
          {/* Paper Project */}
          <div>
            <div className="flex items-center mb-2">
              <p className="mr-2">Gradient Sparse Autoencoders</p>
              <Link href="https://arxiv.org/abs/2411.10397" className="text-blue-600 dark:text-blue-400">
                view paper →
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Introduces a novel approach to extracting neural network features by considering both activation values and their downstream effects.
            </p>
            <div className="w-full flex justify-center">
              <div className="w-3/4">
                <Image
                  src="/paper.png"
                  alt="Gradient analysis visualization"
                  width={600}
                  height={300}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* FreshSesh Project */}
          <div>
            <div className="flex items-center mb-2">
              <p className="mr-2">FreshSesh AI</p>
              <Link href="https://github.com/max4c/freshsesh" className="text-blue-600 dark:text-blue-400">
                view project →
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              A developer tool that uses a local LLM to provide personalized context summaries of your previous work sessions.
            </p>
            <div className="w-full flex justify-center">
              <div className="w-3/4">
                <Image
                  src="/freshsesh.jpeg"
                  alt="FreshSesh AI interface"
                  width={600}
                  height={300}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Website Project */}
          <div>
            <p className="mb-2">maxforsey.com</p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              This website has become so much fun to work on and to experiment with design principles.
            </p>
            <div className="w-full flex justify-center">
              <div className="w-3/4">
                <Image
                  src="/website.png"
                  alt="Website screenshot"
                  width={600}
                  height={300}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 