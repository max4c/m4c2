"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const THEME_OVERRIDE_KEY = "themeOverride"

const resolveTimeTheme = (hour: number) => {
  if (hour >= 7 && hour < 19) return "light"
  return "dark"
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [forcedTheme, setForcedTheme] = React.useState<"light" | "dark" | null>(null)

  React.useEffect(() => {
    try {
      const override = window.localStorage.getItem(THEME_OVERRIDE_KEY)
      if (override === "light" || override === "dark") {
        setForcedTheme(override)
        return
      }
    } catch {
      // ignore
    }

    setForcedTheme(resolveTimeTheme(new Date().getHours()))
  }, [])

  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      disableTransitionOnChange
      storageKey="theme"
      forcedTheme={forcedTheme ?? undefined}
      {...props}
    >
      {/* If not mounted yet, hide content to prevent flashing between themes */}
      {!forcedTheme && 
        <div suppressHydrationWarning style={{ visibility: 'hidden' }}>
          {children}
        </div>
      }
      {/* Once mounted, render children normally */}
      {forcedTheme && children}
    </NextThemesProvider>
  )
}
