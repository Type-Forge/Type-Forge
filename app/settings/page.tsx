"use client"

import { useEffect, useState } from "react"
import { useSettingsStore } from "@/stores/settings-store"
import { playClickSound } from "@/lib/audio"
import Container from "@/components/ui/Container"
import WhiteCard from "@/components/ui/WhiteCard"

// Exact iOS Toggle Switch — matches drill mode CustomDrillBuilder.tsx
interface SwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
  description?: string
}

function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <div className="flex items-center justify-between py-4 px-1 select-none">
      <div className="space-y-0.5 pr-4">
        <span className="text-[14px] font-bold text-text-primary block">{label}</span>
        {description && <span className="text-[12px] text-text-secondary block leading-normal">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => {
          playClickSound("click")
          onChange(!checked)
        }}
        className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center shrink-0 ${
          checked ? "bg-[#34c759]" : "bg-[#e5e5ea] dark:bg-[#39393d]"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <div
          className={`w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ${
            checked ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

// Segmented Control — matches drill mode duration selector
interface SegmentedControlProps<T extends string | number> {
  options: { label: string; value: T }[]
  value: T
  onChange: (val: T) => void
  label: string
  description?: string
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
  description,
}: SegmentedControlProps<T>) {
  return (
    <div className="py-4 px-1 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 pr-4">
          <span className="text-[14px] font-bold text-text-primary block">{label}</span>
          {description && <span className="text-[12px] text-text-secondary block leading-normal">{description}</span>}
        </div>
      </div>
      <div className="bg-surface-secondary p-0.5 rounded-xl flex items-center justify-between border border-border/10 max-w-md">
        {options.map((opt) => {
          const isActive = value === opt.value
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                playClickSound("click")
                onChange(opt.value)
              }}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer select-none active:scale-[0.97] ${
                isActive
                  ? "bg-surface text-accent shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const settings = useSettingsStore()

  // Hydration safety
  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  if (!mounted) {
    return (
      <Container size="7xl" className="py-6 space-y-8 animate-pulse font-sans">
        <div className="border-b border-border/20 pb-4 mb-6">
          <div className="h-3 w-32 bg-surface-secondary rounded mb-2" />
          <div className="h-6 w-48 bg-surface-secondary rounded mb-2" />
          <div className="h-4 w-96 bg-surface-secondary rounded" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-surface-secondary rounded-2xl" />
          <div className="h-44 bg-surface-secondary rounded-2xl" />
          <div className="h-44 bg-surface-secondary rounded-2xl" />
        </div>
      </Container>
    )
  }

  const handleReset = () => {
    playClickSound("Backspace")
    settings.setTheme("dark")
    settings.setTypingSounds(true)
    settings.setAchievementSounds(true)
    settings.setNotificationSounds(true)
    settings.setReducedMotion(false)
    settings.setAchievementToasts(true)
    settings.setAnimations(true)
    settings.setFontSize(30)
    settings.setTextWidth("medium")
    settings.setCaretStyle("line")
    settings.setAccentColor("blue")
  }

  const themeOptions = [
    { label: "System", value: "system" as const },
    { label: "Light", value: "light" as const },
    { label: "Dark", value: "dark" as const },
  ]

  const sizeOptions = [
    { label: "20px", value: 20 },
    { label: "24px", value: 24 },
    { label: "30px", value: 30 },
  ]

  const widthOptions = [
    { label: "Narrow", value: "narrow" as const },
    { label: "Medium", value: "medium" as const },
    { label: "Wide", value: "wide" as const },
  ]

  const caretOptions = [
    { label: "Line", value: "line" as const },
    { label: "Block", value: "block" as const },
    { label: "Underline", value: "underline" as const },
    { label: "Hidden", value: "none" as const },
  ]

  const colors = [
    { name: "blue" as const, bgClass: "bg-[#007aff] dark:bg-[#0a84ff]" },
    { name: "purple" as const, bgClass: "bg-[#af52de] dark:bg-[#bf5af2]" },
    { name: "green" as const, bgClass: "bg-[#34c759] dark:bg-[#30d158]" },
    { name: "orange" as const, bgClass: "bg-[#ff9500] dark:bg-[#ff9f0a]" },
    { name: "red" as const, bgClass: "bg-[#ff3b30] dark:bg-[#ff453a]" },
  ]

  return (
    <Container size="7xl" className="py-6 space-y-8 animate-fade-in font-sans select-none">
      {/* Page Header */}
      <div className="border-b border-border/20 pb-4">
        <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-0.5 uppercase">
          System Preferences
        </span>
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Settings</h2>
        <p className="text-xs text-text-tertiary mt-1">
          Customize your trainer visual appearance, typing sound feedback, and typing metrics.
        </p>
      </div>

      {/* Category 1: Appearance */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Appearance
        </h3>
        <WhiteCard>
          <SegmentedControl
            options={themeOptions}
            value={settings.theme}
            onChange={settings.setTheme}
            label="Interface Theme"
            description="Change the dark mode, light mode, or respect system defaults"
          />
          {/* Accent Color Selection */}
          <div className="flex items-center justify-between py-4 px-1 select-none">
            <div className="space-y-0.5 pr-4">
              <span className="text-[14px] font-bold text-text-primary block">Accent Color</span>
              <span className="text-[12px] text-text-secondary block leading-normal">Personalize the main interface highlight tones</span>
            </div>
            <div className="flex items-center gap-2">
              {colors.map((color) => {
                const isSelected = settings.accentColor === color.name
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      playClickSound("click")
                      settings.setAccentColor(color.name)
                    }}
                    className={`w-6 h-6 rounded-full ${color.bgClass} flex items-center justify-center transition-all duration-150 active:scale-[0.8] hover:scale-[1.05] cursor-pointer focus:outline-none relative border border-black/10 dark:border-white/10`}
                    aria-label={`Select ${color.name} accent`}
                  >
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </WhiteCard>
      </div>

      {/* Category 2: Audio & Sounds */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Audio Settings
        </h3>
        <WhiteCard>
          <Switch
            checked={settings.typingSounds}
            onChange={settings.setTypingSounds}
            label="Keyboard Clicks"
            description="Play mechanical click sounds as you type letters"
          />
          <Switch
            checked={settings.achievementSounds}
            onChange={settings.setAchievementSounds}
            label="Achievement Chimes"
            description="Crisp audio reward when unlocked achievement milestones"
          />
          <Switch
            checked={settings.notificationSounds}
            onChange={settings.setNotificationSounds}
            label="Notification Alerts"
            description="Acoustic alerts on interface alerts or achievements"
          />
        </WhiteCard>
      </div>

      {/* Category 3: Interface & Motion */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Interface Preferences
        </h3>
        <WhiteCard>
          <Switch
            checked={settings.reducedMotion}
            onChange={settings.setReducedMotion}
            label="Reduced Motion"
            description="Minimize slide drawers spring physics transitions"
          />
          <Switch
            checked={settings.animations}
            onChange={settings.setAnimations}
            label="Smooth Transitions"
            description="Render subtle fades and hover scale transitions"
          />
          <Switch
            checked={settings.achievementToasts}
            onChange={settings.setAchievementToasts}
            label="Milestone Toasts"
            description="Display overlay rewards when typing perfect streaks"
          />
        </WhiteCard>
      </div>

      {/* Category 4: Typing Configurations */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Typing Engine
        </h3>
        <WhiteCard>
          <SegmentedControl
            options={sizeOptions}
            value={settings.fontSize}
            onChange={settings.setFontSize}
            label="Display Font Size"
            description="Change the size of the letter outputs"
          />
          <SegmentedControl
            options={widthOptions}
            value={settings.textWidth}
            onChange={settings.setTextWidth}
            label="Container Width"
            description="Limit the maximum width of the typing text box"
          />
          <SegmentedControl
            options={caretOptions}
            value={settings.caretStyle}
            onChange={settings.setCaretStyle}
            label="Caret Cursor Style"
            description="Choose layout shape representation for typing cursor"
          />
        </WhiteCard>
      </div>

      {/* Reset settings button */}
      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={handleReset}
          className="h-11 px-6 rounded-xl bg-incorrect/10 border border-incorrect/20 text-incorrect text-xs font-bold hover:bg-incorrect/15 transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
        >
          Reset to defaults
        </button>
      </div>
    </Container>
  )
}
