import Link from 'next/link';
import Image from 'next/image';
import SocialIcons from '@/components/SocialIcons';
import Highlights from '@/components/Highlights';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { format } from 'date-fns';
import ThemeDropdown from '@/components/ThemeDropdown';
import ImageModal from '@/components/ImageModal';

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

console.log("Render timestamp:", Date.now());

export default function Home() {
  return (
    <div>
      {/* Header Section with Profile */}
      <div className="relative mb-8 -mx-4 sm:mx-0">
        <div className="content-border border-b border-black dark:border-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mb-5 pt-4 md:pt-0 px-4 sm:px-6">
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
      <section key="highlights" className="mb-8 p-4 sm:p-8 border border-black dark:border-white bg-white dark:bg-transparent">
        <h3 className="text-3xl font-bold mb-3">Hi, I&apos;m Max 👋</h3>
        <Highlights />
      </section>

      {/* Blog Section */}
      <section key="blog" className="mb-8 p-4 sm:p-8 border border-black dark:border-white bg-white dark:bg-transparent">
        <h3 className="text-3xl font-bold mb-3">Blog</h3>

        {/* Collections section */}
        <div className="mb-12">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Collections</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Continuously updated lists and resources:</p>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
            {[
              'books', 'films', 'music', 'quotes', 'tools', 'longevity'
            ].map((item) => (
              <Link 
                key={item}
                href={`/blog/${item}`} 
                className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                  rounded-full hover:scale-105 hover:shadow-md
                  border border-black dark:border-white
                  transition-all duration-200 ease-in-out
                  text-black dark:text-white
                  hover:border-black dark:hover:border-white
                  whitespace-nowrap"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Posts section */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Blog Posts</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Individual articles and thoughts:</p>
          <div className="space-y-5">
            {sortedPosts.map(post => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group block py-2 -mx-2 px-2 rounded-lg
                  hover:bg-gray-100/50 dark:hover:bg-gray-700/30
                  transition-colors duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 
                      group-hover:text-[#0957D0] dark:group-hover:text-[#e97319]">
                      {post.title}
                    </h3>
                    <span className="ml-1 text-gray-400 dark:text-gray-500 
                      group-hover:text-[#0957D0] dark:group-hover:text-[#e97319]
                      transition-colors duration-200">
                      ›
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                    {format(post.date, 'MMM yyyy')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Projects and Papers Section */}
      <section key="projects" className="mb-8 p-4 sm:p-8 border border-black dark:border-white bg-white dark:bg-transparent">
        <h3 className="text-3xl font-bold mb-3">Projects and Papers</h3>
        <div className="space-y-8">
          {/* Paper Example */}
          <div className="space-y-4">
            <div className="flex-1">
              <Link href="https://arxiv.org/abs/2312.09251" className="group">
                <h4 className="text-lg font-medium mb-2 group-hover:text-[#0957D0] dark:group-hover:text-[#e97319]">
                  Features that Make a Difference: Leveraging Gradients for Improved Dictionary Learning
                </h4>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Exploring novel approaches to dictionary learning through gradient analysis
              </p>
              <span className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                rounded-full border border-black dark:border-white
                text-black dark:text-white inline-block">
                paper
              </span>
            </div>
            
            <div className="w-full md:w-2/3 mx-auto">
              <ImageModal
                src="/paper.png"
                alt="Gradient analysis visualization"
                width={800}
                height={500}
              />
            </div>
          </div>

          {/* FreshSesh AI Project */}
          <div className="space-y-4">
            <div className="flex-1">
              <Link href="https://freshsesh.ai" className="group">
                <h4 className="text-lg font-medium mb-2 group-hover:text-[#0957D0] dark:group-hover:text-[#e97319]">
                  FreshSesh AI
                </h4>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Built an AI-powered tool that helps you write better session notes. Used by hundreds of therapists to save time and improve their documentation.
              </p>
              <span className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                rounded-full border border-black dark:border-white
                text-black dark:text-white inline-block">
                project
              </span>
            </div>
            
            <div className="w-full md:w-2/3 mx-auto">
              <ImageModal
                src="/freshsesh.jpeg"
                alt="FreshSesh AI interface"
                width={800}
                height={500}
              />
            </div>
          </div>

          {/* maxforsey.com Project */}
          <div className="space-y-4">
            <div className="flex-1">
              <h4 className="text-lg font-medium mb-2">maxforsey.com (Ongoing)</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                This website has become so much fun to work on and to experiment with design principles. It&apos;s also how I learned next.js and tailwind CSS! Below are some previous iterations.
              </p>
              <span className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                rounded-full border border-black dark:border-white
                text-black dark:text-white inline-block">
                project
              </span>
            </div>
            
            <div className="w-full md:w-2/3 mx-auto">
              <ImageModal
                src="/website.png"
                alt="Website screenshot"
                width={800}
                height={500}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
