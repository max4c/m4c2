import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProvider } from '@/context/ThemeContext';

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
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeProvider>
            <div className="flex-grow mx-auto px-4 min-h-screen dark:bg-[#171717] dark:text-white">
              <main className="w-full content-wrapper">
                {children}
              </main>
            </div>
            <Footer />
          </ThemeProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
