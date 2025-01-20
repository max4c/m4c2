export default function MDXContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[650px] mx-auto px-6 prose dark:prose-invert prose-img:rounded-lg prose-img:w-full prose-a:text-primary hover:prose-a:text-[#e97319] prose-headings:scroll-mt-20">
      {children}
    </div>
  );
}
