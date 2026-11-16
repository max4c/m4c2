import type { Metadata, Viewport } from "next";
import "@/components/wardrobe/wardrobe.css";

// Run before the closet paints, including when it opens from the home screen.
const localThemeScript = `(() => {
  let timer;
  function updateTheme() {
    clearTimeout(timer);
    const now = new Date();
    const hour = now.getHours();
    const dark = hour < 7 || hour >= 19;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#171819" : "#ffffff");
    if (!document.hidden) {
      timer = setTimeout(updateTheme, 60000 - now.getSeconds() * 1000 - now.getMilliseconds());
    }
  }
  updateTheme();
  document.addEventListener("visibilitychange", updateTheme);
  window.addEventListener("pageshow", updateTheme);
})();`;

export const metadata: Metadata = {
  title: "Outfits",
  description: "Your wardrobe, at a glance.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  manifest: "/wardrobe.webmanifest",
  appleWebApp: { capable: true, title: "Outfits", statusBarStyle: "default" },
  icons: { icon: "/wardrobe-icon.svg", apple: "/wardrobe-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function WardrobeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: localThemeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
