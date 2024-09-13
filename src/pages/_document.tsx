import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var savedTheme = localStorage.getItem('theme');
              var isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
              document.documentElement.classList.toggle('dark', isDark);
              document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
            })();
          `
        }} />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="891a893f-2148-474a-83d2-13554d03f007"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}