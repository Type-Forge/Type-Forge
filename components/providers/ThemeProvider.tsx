"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { Theme } from "@/types"
import { Toaster } from "sonner"
import { useSettingsStore } from "@/stores/settings-store"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Custom context provider to manage light/dark/system theme states and dynamic accent colors.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeSetting = useSettingsStore((s) => s.theme)
  const accentColor = useSettingsStore((s) => s.accentColor)
  const setThemeSetting = useSettingsStore((s) => s.setTheme)

  const [resolvedTheme, setResolvedTheme] = useState<Theme>("dark")

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    
    const updateTheme = () => {
      let active: Theme = "dark"
      if (themeSetting === "system") {
        active = media.matches ? "dark" : "light"
      } else {
        active = themeSetting === "light" ? "light" : "dark"
      }
      
      setResolvedTheme(active)
      if (active === "dark") {
        document.documentElement.classList.add("dark")
        document.documentElement.classList.remove("light")
      } else {
        document.documentElement.classList.remove("dark")
        document.documentElement.classList.add("light")
      }
    }

    updateTheme()
    media.addEventListener("change", updateTheme)
    return () => media.removeEventListener("change", updateTheme)
  }, [themeSetting])

  // Apply accent colors dynamically based on active accent selection and resolved theme
  useEffect(() => {
    const isDark = resolvedTheme === "dark"
    const colors = {
      blue: {
        dark: { accent: "#0a84ff", hover: "#409cff" },
        light: { accent: "#007aff", hover: "#0063cc" },
      },
      purple: {
        dark: { accent: "#bf5af2", hover: "#d688ff" },
        light: { accent: "#af52de", hover: "#9b3cc4" },
      },
      green: {
        dark: { accent: "#30d158", hover: "#5ee17c" },
        light: { accent: "#34c759", hover: "#28a745" },
      },
      orange: {
        dark: { accent: "#ff9f0a", hover: "#ffb84d" },
        light: { accent: "#ff9500", hover: "#e08200" },
      },
      red: {
        dark: { accent: "#ff453a", hover: "#ff6b63" },
        light: { accent: "#ff3b30", hover: "#d9251c" },
      },
    }

    const currentColors = colors[accentColor as keyof typeof colors] || colors.blue
    const active = isDark ? currentColors.dark : currentColors.light

    document.documentElement.style.setProperty("--accent", active.accent)
    document.documentElement.style.setProperty("--accent-hover", active.hover)
  }, [accentColor, resolvedTheme])

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    setThemeSetting(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, toggleTheme }}>
      {children}
      <Toaster position="top-right" theme={resolvedTheme} />
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
