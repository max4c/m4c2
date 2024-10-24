import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
