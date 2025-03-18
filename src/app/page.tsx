import MinimalHeader from '@/components/MinimalHeader';

export default function Home() {
  return (
    <>
      <MinimalHeader />
      <main className="w-full max-w-2xl mx-auto px-4">
        <p className="text-lg pt-1">
          I like to research AI and build helpful tools
        </p>
      </main>
    </>
  );
}
