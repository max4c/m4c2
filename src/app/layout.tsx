import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AmbienceProvider } from '@/components/AmbienceProvider'
import { Metadata } from 'next'
import UmamiAnalytics from '@/components/UmamiAnalytics'

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
      <body className={`${inter.className}`}>
        <UmamiAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AmbienceProvider>
            <div className="min-h-screen flex flex-col">
              <main className="flex-grow">{children}</main>
            </div>
          </AmbienceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
