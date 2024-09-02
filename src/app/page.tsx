import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ongoingPages = ['books', 'longevity', 'tools', 'films', 'music', 'quotes'];

export default function Home() {
    
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
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Max Forsey is an AI scientist and engineer</h2>
      
      <p className="mb-4">
        Hey! I&apos;m a junior at Brigham Young University studying computer science
        with an emphasis in machine learning.
      </p>

      <p className="mb-4">
        Currently, I am doing AI research in the <a href="https://github.com/BYU-PCCL">PCC Lab</a> focusing on mechanistic
        interpretability. Previously, I cofounded
        <a href="https://www.gosameday.com"> Sameday AI</a>, participating in Y
        Combinator&apos;s W23 batch and AI Grant&apos;s batch 1.
      </p>

      <p className="mb-4">
        At BYU, I&apos;m a VP of the <a href="https://aia.byu.edu">AI Association</a>, which helps provide students from
        diverse academic backgrounds with practical AI experience.
      </p>

      <p className="mb-4">
        I&apos;m always looking out for interesting projects, people, and ideas.
      </p>
      <p className="mb-4">
        Email me at hello[at]maxforsey[dot]com
      </p>

      <h6 className="text-lg font-semibold mt-6 mb-2">Elsewhere</h6>
      <p>
        <a href="https://github.com/max4c" className="mr-4">GitHub</a>
        <a href="https://www.linkedin.com/in/max-forsey" className="mr-4">LinkedIn</a>
        <a href="https://www.youtube.com/channel/UCbxSpKpe9q0dZkJ1jkHWdEg">Youtube</a>
      </p>

      <hr className="border-black dark:border-white my-8" />

    
      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        {ongoingPosts.map((post) => (
          <div key={post.slug} className="w-full">
            <Link 
              href={`/blog/${post.slug}`} 
              className="hover:text-[#e97319] block w-full p-2 border border-gray-300 dark:border-gray-700 text-center transition-colors duration-200 rounded-lg"
            >
              {post.title}
            </Link>
          </div>
        ))}
      </div>
      <br />
    </div>
  );
}
