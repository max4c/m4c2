import OrbitHero from '@/components/orbit/OrbitHero';
import { getAllPosts } from '@/lib/blog';
import Link from 'next/link';
import { format } from 'date-fns';

export default function Home() {
  const posts = getAllPosts().filter((post) => post.type !== 'ongoing');
  const writing = posts.slice(0, 8);

  return (
    <>
      <OrbitHero />
      <section className="w-full px-4 pb-24 pt-16 sm:px-10">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <p className="text-xs font-semibold tracking-[0.26em] uppercase opacity-60">Writing</p>
          <ul className="space-y-4">
            {writing.map((post) => (
              <li key={post.slug} className="flex flex-wrap items-baseline justify-between gap-3">
                <Link href={`/blog/${post.slug}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
                <span className="text-sm opacity-55">{format(post.date, 'MMM yyyy')}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
