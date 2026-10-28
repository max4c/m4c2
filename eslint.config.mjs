import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextVitals,
  {
    files: ['src/components/emails/**/*.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'convex/_generated/**', '.daso/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
