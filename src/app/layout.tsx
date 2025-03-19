import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://maxforsey.com'),
  title: 'Max Forsey',
  description: 'I like to research AI and build helpful tools',
  openGraph: {
    title: 'Max Forsey',
    description: 'I like to research AI and build helpful tools',
    url: 'https://maxforsey.com',
    siteName: 'Max Forsey',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Max Forsey',
    description: 'I like to research AI and build helpful tools',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="!scroll-smooth" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} bg-white text-black dark:bg-black dark:text-[rgba(255,255,255,0.87)]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
