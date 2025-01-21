import { Metadata } from 'next'
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://maxforsey.com'),
  title: 'Max Forsey',
  description: 'I like to research AI and build helpful tools 🛠️',
  openGraph: {
    title: 'Max Forsey',
    description: 'I like to research AI and build helpful tools 🛠️',
    url: 'https://maxforsey.com',
    siteName: 'Max Forsey',
    images: [
      {
        url: '/DigitalProfile_tiny.png', // your profile image
        width: 192,
        height: 192,
        alt: 'Max Forsey',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Max Forsey',
    description: 'I like to research AI and build helpful tools 🛠️',
    images: ['/DigitalProfile_tiny.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col items-center">
            <div className="w-full max-w-[650px] flex-grow">
              <main className="px-4 sm:px-6">
                {children}
              </main>
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
