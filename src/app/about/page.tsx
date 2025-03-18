import MinimalHeader from '@/components/MinimalHeader';
import Link from 'next/link';

const highlights = [
  "Researching AI in the PCC Lab",
  "Studying machine learning at BYU",
  "Co-founder of justbuild, the builder community",
  "Venture Partner at Contrary",
  "Cofounded Sameday AI going through AI Grant and YC",
  "Recently lived in San Francisco, currently in Provo",
  "Hiked the Grand Canyon rim to rim",
  "Type in Colemak",
  "Have fun experimenting with longevity",
  "Use a split keyboard and vertical mouse",
  "Daily driver is a flip phone"
];

export default function AboutPage() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">about</h2>
        <div className="space-y-2 mb-8">
          {highlights.map((highlight, index) => (
            <p key={index}>{highlight}</p>
          ))}
        </div>
        
        <h3 className="text-xl font-bold mb-4">interests</h3>
        <div className="space-y-2">
          <p><Link href="/blog/books" className="text-blue-600 dark:text-blue-400">books</Link></p>
          <p><Link href="/blog/films" className="text-blue-600 dark:text-blue-400">films</Link></p>
          <p><Link href="/blog/music" className="text-blue-600 dark:text-blue-400">music</Link></p>
          <p><Link href="/blog/longevity" className="text-blue-600 dark:text-blue-400">longevity</Link></p>
          <p><Link href="/blog/tools" className="text-blue-600 dark:text-blue-400">tools</Link></p>
          <p><Link href="/blog/quotes" className="text-blue-600 dark:text-blue-400">quotes</Link></p>
        </div>
      </main>
    </>
  );
} 