import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogContent from './BlogContent';
import { format, parseISO, startOfMonth } from 'date-fns';
import Link from 'next/link';

const ongoingPages = ['books', 'longevity', 'films', 'music', 'quotes', 'tools'];

export type Post = {
  slug: string;
  title: string;
  type: string;
  date: Date;
};

function groupPostsByMonthYear(posts: Post[]) {
  const grouped: { [key: string]: Post[] } = {};
  posts.forEach(post => {
    if (post.date instanceof Date && !isNaN(post.date.getTime())) {
      // Use startOfMonth to ensure consistent grouping
      const monthStart = startOfMonth(post.date);
      const key = format(monthStart, 'MMMM yyyy');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(post);
    } else {
      console.error(`Invalid date for post: ${post.slug}`);
    }
  });
  // Sort posts within each month
  Object.values(grouped).forEach(monthPosts => {
    monthPosts.sort((a, b) => b.date.getTime() - a.date.getTime());
  });
  return Object.entries(grouped).sort((a, b) => 
    parseISO(b[0]).getTime() - parseISO(a[0]).getTime()
  );
}

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
      // Convert the date string to a Date object
      date = new Date(data.date);
      // If the date is invalid, log an error
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
  const groupedBlogPosts = groupPostsByMonthYear(sortedPosts);

  console.log('Parsed posts:', posts);
  console.log('Grouped posts:', groupedBlogPosts);

  return (
    <div className="w-full pt-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold hover:text-gray-600 transition-colors">
            Max Forsey&apos;s
          </Link>
          <span className="text-xl font-bold"> Blog</span>
        </div>
      </div>
      <BlogContent blogPosts={groupedBlogPosts} />
    </div>
  );
}
