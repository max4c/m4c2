import Link from 'next/link';
import Image from 'next/image';
import SocialIcons from '@/components/SocialIcons';
import Highlights from '@/components/Highlights';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { format } from 'date-fns';

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
    <div className="max-w-2xl mx-auto px-4">
      {/* Header Section with Profile */}
      <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Image 
            src="/DigitalProfile_tiny.png"
            alt="Max Forsey"
            width={192}
            height={192}
            className="rounded-full"
          />
          <div>
            <h1 className="text-4xl font-bold">Max Forsey</h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              I like to research AI and
            </p>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              build helpful tools  🛠️ 
            </p>
            <div className="flex items-center gap-2 mt-2">
              <SocialIcons />
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="mb-8">
        <p className="mb-4">
          Hi, I&apos;m a junior at Brigham Young University studying computer science with 
          an emphasis in Machine Learning.
        </p>
        <p className="mb-4">
          Currently, I am doing AI research in the <a href="https://github.com/BYU-PCCL" className="text-blue-600 hover:underline">PCC Lab</a> focusing on mechanistic 
          interpretability. Previously, I cofounded <a href="https://www.gosameday.com" className="text-blue-600 hover:underline">Sameday AI</a>, participating in Y 
          Combinator&apos;s W23 batch and AI Grant&apos;s batch 1.
        </p>
      </div>

      {/* Publications Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Publications</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Features that Make a Difference: Leveraging Gradients for Improved Dictionary Learning</p>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <Highlights />

      {/* Work Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Work</h2>
        <p className="mb-4">For my career, I follow the advice of Charlie Munger:</p>
        <p className="mb-4 italic">&quot;You want to deliver to the world what you would buy if you were on the other end.&quot;</p>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">PCC Lab (May 2024-Present): AI Research Assistant</h3>
            <p className="text-gray-500 dark:text-gray-400">I research sparse autoencoders, interpretability, and hallucinations in the context of AI safety.</p>
          </div>
          <div>
            <h3 className="font-medium">Sameday (May 2022-Oct 2023): Cofounder & CTO</h3>
            <p className="text-gray-500 dark:text-gray-400">Engineered an AI phone agent that handled 4000+ calls monthly and successfully went through YCombinator and AI grant.</p>
          </div>
          <div>
            <h3 className="font-medium">Juni Learning (May 2022-Oct 2022): Computer Science Tutor</h3>
            <p className="text-gray-500 dark:text-gray-400">Mentored 4 students (ages 8-16) for 8+ months in computer science, advancing one from Python basics to mastering complex algorithms like merge sort.</p>
          </div>
        </div>
      </section>

  {/* Blog Section */}
  <section className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">Blog</h2>
      <Link 
        href="/blog" 
        className="text-sm px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 
                  hover:border-gray-400 dark:hover:border-gray-500 
                  transition-all duration-200"
      >
        More →
      </Link>
    </div>
    <div className="space-y-4">
      {sortedPosts.slice(0, 3).map(post => (
        <div key={post.slug}>
          <Link href={`/blog/${post.slug}`} className="text-blue-600 hover:underline">
            {post.title}
          </Link>
        </div>
      ))}
    </div>
  </section>

      {/* Projects Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Projects</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">maxforsey.com (Ongoing)</h3>
            <p className="text-gray-500 dark:text-gray-400">This website has become so much fun to work on and to experiment with design principles. It&apos;s also how I learned next.js and tailwind CSS!</p>
          </div>
          <div>
            <h3 className="font-medium">FreshSesh AI (March 2024)</h3>
            <p className="text-gray-500 dark:text-gray-400">A macOS menu bar tool that summarizes recent git commits using a local LLM. It also won Best 1 Person Team at BYU&apos;s YHack hackathon.</p>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Skills</h2>
        <p>
          <span>Languages:</span> 
          <span className="text-gray-500 dark:text-gray-400"> Python, Java, Node.js, C++, JavaScript, CSS, HTML</span>
        </p>
        <p>
          <span>Databases:</span> 
          <span className="text-gray-500 dark:text-gray-400"> MySQL, NoSQL, Firebase</span>
        </p>
        <p>
          <span>Machine Learning & LLMs:</span> 
          <span className="text-gray-500 dark:text-gray-400"> PyTorch, NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn</span>
        </p>
        <p>
          <span>Misc:</span> 
          <span className="text-gray-500 dark:text-gray-400"> Linear, Ollama, Notion, Twilio, Github, GCP, Eagle Scout, Crucial Conversations</span>
        </p>
      </section>

      {/* Deep Dive Section - with reduced margin */}
      <section>
        <h2 className="text-xl font-bold mb-4">Deep Dive</h2>
        <p className="mb-4">Explore these ongoing pages to get a sense of who I am and what I value.</p>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/blog/books" className="text-center p-2 border rounded-lg border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
            Books
          </Link>
          <Link href="/blog/longevity" className="text-center p-2 border rounded-lg border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
            Longevity
          </Link>
          <Link href="/blog/tools" className="text-center p-2 border rounded-lg border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
            Tools
          </Link>
          <Link href="/blog/films" className="text-center p-2 border rounded-lg border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
            Films
          </Link>
          <Link href="/blog/music" className="text-center p-2 border rounded-lg border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
            Music
          </Link>
          <Link href="/blog/quotes" className="text-center p-2 border rounded-lg border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
            Quotes
          </Link>
        </div>
      </section>

      {/* Add margin-bottom to match the header spacing */}
      <div className="mb-8"></div>
    </div>
  );
}
