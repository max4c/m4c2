import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ThemeWrapper from "@/components/ThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "maxforsey",
  description: "Max Forsey's personal website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <ThemeWrapper>
          <script dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var root = document.documentElement;
                var initialColorMode = root.style.getPropertyValue('--initial-color-mode');
                root.classList.add(initialColorMode);
              })();
            `
          }} />
          <div className="mx-auto px-4 min-h-screen dark:bg-[#171717] dark:text-white">
            <Header />
            <main className="content-wrapper">
              {children}
            </main>
          </div>
        </ThemeWrapper>
      </body>
    </html>
  );
}
