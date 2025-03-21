"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Track if component is mounted
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Forward all props to NextThemesProvider
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem={true}
      disableTransitionOnChange
      storageKey="theme"
      {...props}
    >
      {/* If not mounted, use a div with forceTheme to prevent flash */}
      {!mounted && 
        <div suppressHydrationWarning style={{ visibility: 'hidden' }}>
          {children}
        </div>
      }
      {/* Once mounted, render children normally */}
      {mounted && children}
    </NextThemesProvider>
  )
}
