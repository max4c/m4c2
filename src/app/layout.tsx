import './globals.css'
import { Inter } from 'next/font/google'
import { AmbienceProvider } from '@/components/AmbienceProvider'
import MinimalFooter from '@/components/MinimalFooter'
import { Metadata } from 'next'
import UmamiAnalytics from '@/components/UmamiAnalytics'

const inter = Inter({ subsets: ['latin'] })
const THEME_OVERRIDE_KEY = 'themeOverride'
const TIME_THEME_SCRIPT = `
(function () {
  try {
    var override = window.localStorage.getItem('${THEME_OVERRIDE_KEY}');
    var theme;
    if (override === 'light' || override === 'dark') {
      theme = override;
    } else {
      var hour = new Date().getHours();
      theme = (hour >= 7 && hour < 19) ? 'light' : 'dark';
    }
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();`.trim()

export const metadata: Metadata = {
  metadataBase: new URL('https://maxforsey.com'),
  title: 'Max Forsey',
  description: 'I like to research AI and build helpful tools',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: TIME_THEME_SCRIPT }} />
      </head>
      <body className={`${inter.className}`}>
        <UmamiAnalytics />
        <AmbienceProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">{children}</main>
            <MinimalFooter />
          </div>
        </AmbienceProvider>
      </body>
    </html>
  )
}
