import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'content': '650px',
      },
      width: {
        'content': '650px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '650px', // This ensures prose content also respects the new width
          },
        },
      },
      fontSize: {
        base: '1.05rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};

export default config;
