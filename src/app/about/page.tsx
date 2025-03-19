import MinimalHeader from '@/components/MinimalHeader';
import Link from 'next/link';

type HighlightLink = {
  url: string;
  text: string;
};

type Highlight = {
  text: string;
  links?: HighlightLink[] | null;
};

const highlights: Highlight[] = [
  { text: "Researching AI in the PCC Lab", links: null },
  { text: "Studying machine learning at BYU", links: null },
  { text: "Co-founder of justbuild, the builder community", links: [{ url: "https://justbuild.ing/", text: "justbuild" }] },
  { text: "Venture Partner at Contrary", links: [{ url: "https://contrary.com", text: "Contrary" }] },
  { text: "Cofounded Sameday AI going through AI Grant and YC", 
    links: [
      { url: "https://www.gosameday.com/", text: "Sameday AI" },
      { url: "https://aigrant.com/", text: "AI Grant" }
    ] 
  },
  { text: "Recently lived in San Francisco, currently in Provo", links: null },
  { text: "Hiked the Grand Canyon rim to rim", links: null },
  { text: "Type in Colemak", links: [{ url: "https://colemak.com/", text: "Colemak" }] },
  { text: "Have fun experimenting with longevity", links: [{ url: "https://www.maxforsey.com/blog/longevity", text: "longevity" }] },
  { text: "Use a split keyboard and vertical mouse", 
    links: [
      { url: "https://www.zsa.io/moonlander/", text: "split keyboard" },
      { url: "https://www.logitech.com/en-us/products/mice/lift-vertical-ergonomic-mouse.html", text: "vertical mouse" }
    ] 
  },
  { text: "Daily driver is a flip phone", links: [{ url: "https://sunbeamwireless.com/", text: "flip phone" }] }
];

export default function AboutPage() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <div className="space-y-2 mb-8">
          {highlights.map((highlight, index) => (
            <p key={index}>
              {highlight.links ? (
                // Split text by the linked terms and interleave with links
                <>
                  {highlight.text.split(new RegExp(highlight.links.map(link => link.text).join('|'))).map((part, i) => (
                    <span key={i}>
                      {part}
                      {highlight.links && highlight.links[i] && (
                        <Link 
                          href={highlight.links[i].url} 
                          className="text-blue-600 dark:text-blue-400"
                        >
                          {highlight.links[i].text}
                        </Link>
                      )}
                    </span>
                  ))}
                </>
              ) : (
                highlight.text
              )}
            </p>
          ))}
        </div>
        
        <p className="font-bold mb-4">interests</p>
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