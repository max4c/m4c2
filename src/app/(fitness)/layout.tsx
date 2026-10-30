import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/components/fitness/fitness.css";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Supermedium",
  description: "Your private training, nutrition, and progress log.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  manifest: "/fitness.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Supermedium",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/supermedium-icons/icon.svg", type: "image/svg+xml" },
      {
        url: "/supermedium-icons/icon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/supermedium-icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};
export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
