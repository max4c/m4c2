import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogContent from './BlogContent';

const ongoingPages = ['books', 'longevity', 'films', 'music', 'quotes', 'tools'];

type Post = {
  slug: string;
  title: string;
  type: string;
  date: Date;
};

function groupPostsByMonthYear(posts: Post[]) {
  const grouped: { [key: string]: Post[] } = {};
  posts.forEach(post => {
    const date = post.date;
    const key = `${date.getFullYear()}-${(date.getMonth()).toString().padStart(2, '0')}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(post);
  });
  return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function BlogPage() {
  const blogDir = path.join(process.cwd(), 'src/app/blog');
  const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));

  const posts = files.map(filename => {
    const slug = filename.replace('.mdx', '');
    const filePath = path.join(blogDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    return {
      slug,
      title: data.title || slug,
      type: ongoingPages.includes(slug) ? 'ongoing' : 'post',
      date: data.date ? new Date(data.date) : new Date(0) // Default to epoch if no date
    };
  });

  const sortedPosts = posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  const ongoingPosts = sortedPosts.filter(post => post.type === 'ongoing');
  const blogPosts = sortedPosts.filter(post => post.type === 'post');

  const groupedBlogPosts = groupPostsByMonthYear(blogPosts);

  return <BlogContent blogPosts={groupedBlogPosts} ongoingPosts={ongoingPosts} />;
}
