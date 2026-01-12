import OrbitHero from '@/components/orbit/OrbitHero';
import { getAllPosts, type Post } from '@/lib/blog';
import Link from 'next/link';
import { format } from 'date-fns';

const isPost = (value: Post | undefined): value is Post => Boolean(value);

export default function Home() {
  const allPosts = getAllPosts().filter((post) => post.type !== 'ongoing');
  const essayPosts = allPosts.filter((post) => post.type !== 'build');
  const selectedSlugs = [
    'how-to-build-with-ai',
    'chronotype-based-scheduling',
    'longevity-the-new-compound-interest',
  ];
  const selectedWriting = selectedSlugs
    .map((slug) => essayPosts.find((post) => post.slug === slug))
    .filter(isPost)
    .slice(0, 3);
  const recentWriting = essayPosts.slice(0, 5);

  return (
    <>
      <OrbitHero />
      <section className="w-full px-4 pb-24 pt-16 sm:px-10">
        <div className="mx-auto w-full max-w-4xl space-y-16">
          <div className="space-y-5">
            <p className="text-xs font-semibold tracking-[0.26em] uppercase opacity-60">
              Selected writing
            </p>
            <ul className="space-y-4">
              {selectedWriting.map((post) => (
                <li key={post.slug} className="flex flex-wrap items-baseline justify-between gap-3">
                  <Link href={`/blog/${post.slug}`} className="font-medium hover:underline">
                    {post.title}
                  </Link>
                  <span className="text-sm opacity-55">{format(post.date, 'MMM yyyy')}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <p className="text-xs font-semibold tracking-[0.26em] uppercase opacity-60">
              Recent writing
            </p>
            <ul className="space-y-4">
              {recentWriting.map((post) => (
                <li key={post.slug} className="flex flex-wrap items-baseline justify-between gap-3">
                  <Link href={`/blog/${post.slug}`} className="font-medium hover:underline">
                    {post.title}
                  </Link>
                  <span className="text-sm opacity-55">{format(post.date, 'MMM yyyy')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
