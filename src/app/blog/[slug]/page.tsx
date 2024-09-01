import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import MDXContent from '@/components/MDXContent';
import * as MDXComponents from '@/components/MDXComponents';
import matter from 'gray-matter';

export async function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'src/app/blog');
  const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));
  return files.map(file => ({
    slug: file.replace('.mdx', ''),
  }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'src/app/blog', `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const { content } = matter(fileContent);

  return (
    <MDXContent>
      <MDXRemote
        source={content}
        components={{
          ...MDXComponents,
          iframe: MDXComponents.Iframe
        }}
      />
    </MDXContent>
  );
}