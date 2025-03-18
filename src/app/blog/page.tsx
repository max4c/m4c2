import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { format } from 'date-fns';
import Link from 'next/link';
import MinimalHeader from '@/components/MinimalHeader';

export type Post = {
  slug: string;
  title: string;
  type: string;
  date: Date;
};

export default function BlogPage() {
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

  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="space-y-5">
          {sortedPosts.map((post) => (
            <div key={post.slug} className="flex items-baseline">
              <span className="text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">
                {format(post.date, 'dd MMM yyyy')}
              </span>
              <Link 
                href={`/blog/${post.slug}`} 
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                {post.title}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
