import type { Metadata, Viewport } from "next";
import "@/components/fitness/fitness.css";
export const metadata: Metadata = {
  title: "Supermedium",
  description: "Your private training, nutrition, and progress log.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  manifest: "/fitness.webmanifest",
  appleWebApp: { capable: true, title: "Supermedium", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f3ed",
};
export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
