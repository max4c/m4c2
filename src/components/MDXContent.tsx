export default function MDXContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[650px] mx-auto px-6 prose dark:prose-invert">
      {children}
    </div>
  );
}
