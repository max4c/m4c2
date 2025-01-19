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
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Collections</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Continuously updated lists and resources:</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2 pb-2">
            {[
              'books', 'films', 'music', 'quotes', 'tools', 'longevity'
            ].map((item) => (
              <Link 
                key={item}
                href={`/blog/${item}`} 
                className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                  border border-black dark:border-white
                  transition-all duration-200
                  text-black dark:text-white
                  hover:bg-[#0957D0] dark:hover:bg-[#e97319]
                  hover:text-white dark:hover:text-white
                  hover:border-[#0957D0] dark:hover:border-[#e97319]
                  whitespace-nowrap text-center"
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
                className="group block mb-4 px-3 py-2
                    border border-black dark:border-white
                    transition-all duration-200
                    bg-white dark:bg-transparent
                    text-black dark:text-white
                    hover:bg-[#0957D0] dark:hover:bg-[#e97319]
                    hover:text-white dark:hover:text-white
                    hover:border-[#0957D0] dark:hover:border-[#e97319]"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="font-medium">
                      {post.title}
                    </h3>
                  </div>
                  <span className="text-sm ml-4 opacity-70">
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
              <Link href="https://arxiv.org/abs/2312.09251" className="group flex items-center gap-3 mb-2">
                <h4 className="text-lg font-medium group-hover:text-[#0957D0] dark:group-hover:text-[#e97319]">
                  Features that Make a Difference: Leveraging Gradients for Improved Dictionary Learning
                </h4>
                <span className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                  border border-black dark:border-white
                  transition-all duration-200
                  text-black dark:text-white
                  group-hover:bg-[#0957D0] dark:group-hover:bg-[#e97319]
                  group-hover:text-white dark:group-hover:text-white
                  group-hover:border-[#0957D0] dark:group-hover:border-[#e97319]">
                  paper
                </span>
              </Link>
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
              <Link href="https://freshsesh.ai" className="group flex items-center gap-3 mb-2">
                <h4 className="text-lg font-medium group-hover:text-[#0957D0] dark:group-hover:text-[#e97319]">
                  FreshSesh AI
                </h4>
                <span className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                  border border-black dark:border-white
                  transition-all duration-200
                  text-black dark:text-white
                  group-hover:bg-[#0957D0] dark:group-hover:bg-[#e97319]
                  group-hover:text-white dark:group-hover:text-white
                  group-hover:border-[#0957D0] dark:group-hover:border-[#e97319]">
                  project
                </span>
              </Link>
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
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-medium">
                  maxforsey.com
                </h4>
                <span className="px-3 py-1.5 text-sm bg-white dark:bg-transparent 
                  border border-black dark:border-white
                  text-black dark:text-white">
                  project
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                This website has become so much fun to work on and to experiment with design principles. It&apos;s also how I learned next.js and tailwind CSS! Below are some previous iterations.
              </p>
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
