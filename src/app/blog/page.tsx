import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogContent from './BlogContent';
import { format, parseISO, startOfMonth } from 'date-fns';
import Link from 'next/link';
import ThemeDropdown from '@/components/ThemeDropdown';

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
    <>
      <div className="w-full">
        <div className="content-border border-b">
          <div className="max-w-[650px] mx-auto px-6">
            <header className="blog-header w-full pt-6 pb-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl font-bold">Max Forsey&apos;s Blog</span>
                <div className="flex items-center gap-2">
                  <Link 
                    href="/" 
                    className="text-sm px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 
                              hover:border-gray-400 dark:hover:border-gray-500 
                              transition-all duration-200 nav-button"
                  >
                    About
                  </Link>
                  <ThemeDropdown />
                </div>
              </div>
            </header>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[650px] mx-auto px-6 pt-3">
        <BlogContent blogPosts={groupedBlogPosts} />
      </div>
    </>
  );
}
