import fs from 'fs';
import path from 'path';

export async function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'src/app/blog');
  const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));
  return files.map(file => ({
    slug: file.replace('.mdx', ''),
  }));
}