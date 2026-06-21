import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface SettingsState {
  theme: "light" | "dark" | "system"
  typingSounds: boolean
  achievementSounds: boolean
  notificationSounds: boolean
  reducedMotion: boolean
  achievementToasts: boolean
  animations: boolean
  fontSize: number
  textWidth: "narrow" | "medium" | "wide"
  caretStyle: "line" | "block" | "underline" | "none"
  accentColor: "blue" | "purple" | "green" | "orange" | "red"
  difficulty: "easy" | "medium" | "hard"

  setTheme: (theme: "light" | "dark" | "system") => void
  setTypingSounds: (val: boolean) => void
  setAchievementSounds: (val: boolean) => void
  setNotificationSounds: (val: boolean) => void
  setReducedMotion: (val: boolean) => void
  setAchievementToasts: (val: boolean) => void
  setAnimations: (val: boolean) => void
  setFontSize: (val: number) => void
  setTextWidth: (val: "narrow" | "medium" | "wide") => void
  setCaretStyle: (val: "line" | "block" | "underline" | "none") => void
  setAccentColor: (val: "blue" | "purple" | "green" | "orange" | "red") => void
  setDifficulty: (val: "easy" | "medium" | "hard") => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      typingSounds: true,
      achievementSounds: true,
      notificationSounds: true,
      reducedMotion: false,
      achievementToasts: true,
      animations: true,
      fontSize: 36,
      textWidth: "wide",
      caretStyle: "line",
      accentColor: "blue",
      difficulty: "easy",

      setTheme: (theme) => set({ theme }),
      setTypingSounds: (val) => set({ typingSounds: val }),
      setAchievementSounds: (val) => set({ achievementSounds: val }),
      setNotificationSounds: (val) => set({ notificationSounds: val }),
      setReducedMotion: (val) => set({ reducedMotion: val }),
      setAchievementToasts: (val) => set({ achievementToasts: val }),
      setAnimations: (val) => set({ animations: val }),
      setFontSize: (val) => set({ fontSize: val }),
      setTextWidth: (val) => set({ textWidth: val }),
      setCaretStyle: (val) => set({ caretStyle: val }),
      setAccentColor: (val) => set({ accentColor: val }),
      setDifficulty: (val) => set({ difficulty: val }),
    }),
    { name: "turing-type-settings-v3" }
  )
)
