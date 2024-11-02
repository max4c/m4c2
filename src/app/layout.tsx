import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "maxforsey",
  description: "Max Forsey's personal website",
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
            <div className="w-full max-w-[650px] px-6 flex-grow">
              <main>
                {children}
              </main>
            </div>
            <div className="w-full max-w-[650px] px-6">
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
