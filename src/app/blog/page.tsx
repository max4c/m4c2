import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogContent from './BlogContent';
import { format, addMonths } from 'date-fns';

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
      const advancedDate = addMonths(post.date, 1);
      const key = format(advancedDate, 'MMMM yyyy');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(post);
    } else {
      console.error(`Invalid date for post: ${post.slug}`);
    }
  });
  return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
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
    <BlogContent blogPosts={groupedBlogPosts} />
  );
}
