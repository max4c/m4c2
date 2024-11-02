import Link from 'next/link';
import Image from 'next/image';
import SocialIcons from '@/components/SocialIcons';
import Highlights from '@/components/Highlights';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { format } from 'date-fns';
import ThemeDropdown from '@/components/ThemeDropdown';

const blogDir = path.join(process.cwd(), 'src/app/blog');
const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));

const posts = files.map(filename => {
  const slug = filename.replace('.mdx', '');
  const filePath = path.join(blogDir, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);
  let date = new Date(0);
  if (data.date) {
    date = new Date(data.date);
    if (isNaN(date.getTime())) {
      console.error(`Invalid date for ${filename}: ${data.date}`);
      date = new Date(0);
    }
  }
  return {
    slug,
    title: data.title || slug,
    date,
    type: data.type || 'post'
  };
}).filter(post => post.type === 'post' && !isNaN(post.date.getTime()));

const sortedPosts = posts.sort((a, b) => b.date.getTime() - a.date.getTime());

export default function Home() {
  return (
    <div>
      {/* Header Section with Profile */}
      <div className="relative mb-8">
        <div className="content-border border-b">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mb-5 pt-4 md:pt-0">
            <Image 
              src="/DigitalProfile_tiny.png"
              alt="Max Forsey"
              width={192}
              height={192}
              className="rounded-full"
            />
            <div className="flex flex-col items-center md:items-start md:pt-8">
              <h1 className="text-4xl font-bold mb-1">Max Forsey</h1>
              {/* Mobile version - single line */}
              <p className="md:hidden text-gray-500 dark:text-gray-400 font-bold mb-2">
                I like to research AI and build helpful tools 🛠️
              </p>
              {/* Desktop version - two lines */}
              <div className="hidden md:block text-gray-500 dark:text-gray-400 font-bold mb-2">
                <p>I like to research AI and</p>
                <p>build helpful tools 🛠️</p>
              </div>
              <div className="flex items-center gap-3">
                <SocialIcons />
                <ThemeDropdown />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Highlights Section */}
      <Highlights />

      {/* Blog Section */}
      <section className="mb-8 p-6 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Blog</h2>
        </div>

        {/* Ongoing section */}
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Ongoing</h3>
          <div className="flex flex-wrap gap-3">
            {[
              'books', 'films', 'music', 'quotes', 'tools', 'longevity'
            ].map((item) => (
              <Link 
                key={item}
                href={`/blog/${item}`} 
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 
                  rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 
                  border border-gray-200 dark:border-gray-700
                  transition-colors duration-200
                  text-gray-700 dark:text-gray-300"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Posts section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Posts</h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedPosts.map(post => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group block py-4 first:pt-0 last:pb-0
                  hover:bg-gray-100/50 dark:hover:bg-gray-700/50
                  transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(post.date, 'MMM yyyy')}
                    </span>
                    <svg 
                      className="w-4 h-4 text-gray-400 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section className="mb-8 p-6 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
        <h2 className="text-xl font-bold mb-4">Projects and Papers</h2>
        <div className="space-y-4">
          {/* Paper */}
          <div>
            <h3 className="font-medium mb-1">
              Features that Make a Difference: Leveraging Gradients for Improved Dictionary Learning
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 ml-2 hover:underline !decoration-gray-400 dark:!decoration-gray-500">
                paper
              </a>
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Exploring novel approaches to dictionary learning through gradient analysis
            </p>
          </div>

          {/* Projects */}
          <div>
            <h3 className="font-medium mb-1">
              maxforsey.com (Ongoing)
              <a href="https://github.com/max4c/m4c2" className="text-sm text-gray-500 dark:text-gray-400 ml-2 hover:underline !decoration-gray-400 dark:!decoration-gray-500">
                project
              </a>
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This website has become so much fun to work on and to experiment with design principles. It&apos;s also how I learned next.js and tailwind CSS!
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-1">
              FreshSesh AI (March 2024)
              <a href="https://github.com/max4c/freshsesh" className="text-sm text-gray-500 dark:text-gray-400 ml-2 hover:underline !decoration-gray-400 dark:!decoration-gray-500">
                project
              </a>
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              A macOS menu bar tool that summarizes recent git commits using a local LLM. It also won Best 1 Person Team at BYU&apos;s YHack hackathon.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
