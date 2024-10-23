import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ongoingPages = ['books', 'longevity', 'tools', 'films', 'music', 'quotes'];

export default function About() {
  const blogDir = path.join(process.cwd(), 'src/app/blog');
  const ongoingPosts = ongoingPages.map(slug => {
    const filePath = path.join(blogDir, `${slug}.mdx`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    return {
      slug,
      title: data.title || slug.charAt(0).toUpperCase() + slug.slice(1)
    };
  });

  return (
    <div className="content-wrapper">
      <h1 className="text-2xl font-bold mb-4">About</h1>
      
      <p className="mb-4">
        Explore these ongoing pages to get a sense of who I am and what I value.
      </p>

      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        {ongoingPosts.map((post) => (
          <div key={post.slug} className="w-full">
    <Link 
              href={`/blog/${post.slug}`} 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white block w-full p-2 border border-gray-300 dark:border-gray-700 text-center transition-colors duration-200 rounded-lg"
            >
              {post.title}
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}