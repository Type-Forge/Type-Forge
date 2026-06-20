"use client"

import { motion, AnimatePresence } from "motion/react"
import { playClickSound } from "@/lib/audio"
import { useSettingsStore } from "@/stores/settings-store"
import { GroupedList, GroupedListItem } from "@/components/ui/GroupedList"

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface SwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
}

function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => {
        playClickSound("click")
        onChange(!checked)
      }}
      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative cursor-pointer shrink-0 ${
        checked ? "bg-accent" : "bg-text-muted/40"
      }`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const {
    achievementSounds,
    achievementToasts,
    reducedMotion,
    setAchievementSounds,
    setAchievementToasts,
    setReducedMotion,
  } = useSettingsStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end pointer-events-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-auto"
            onClick={() => {
              playClickSound("click")
              onClose()
            }}
          />

          {/* iOS Slide-up Settings Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250, mass: 0.9 }}
            className="relative w-full max-w-sm mx-auto bg-surface/90 border border-border border-b-0 backdrop-blur-[40px] rounded-t-[38px] p-6 pb-10 shadow-[0_-15px_50px_rgba(0,0,0,0.25)] pointer-events-auto flex flex-col select-none"
          >
            {/* iOS Drag Handle */}
            <div className="w-10 h-[5px] rounded-full bg-text-tertiary/30 mx-auto mb-5 mt-1 shrink-0" />

            {/* Close Button */}
            <button
              onClick={() => {
                playClickSound("click")
                onClose()
              }}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/15 dark:border-white/15 text-text-primary flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <div className="mb-6">
              <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-0.5 uppercase">
                System Preferences
              </span>
              <h3 className="text-xl font-sans font-bold text-text-primary">
                TypeForge Settings
              </h3>
            </div>

            {/* Settings Toggles in a Grouped List */}
            <div className="space-y-6 flex-1">
              <GroupedList className="font-sans">
                {/* Achievement Sounds Toggle */}
                <GroupedListItem
                  title="Achievement Sounds"
                  subtitle="Play crisp chime feedbacks on milestone completions"
                  className="py-3"
                  rightElement={
                    <Switch
                      checked={achievementSounds}
                      onChange={setAchievementSounds}
                    />
                  }
                />
                
                {/* Achievement Toasts Toggle */}
                <GroupedListItem
                  title="Achievement Toasts"
                  subtitle="Display sliding milestone toast alerts"
                  className="py-3"
                  rightElement={
                    <Switch
                      checked={achievementToasts}
                      onChange={setAchievementToasts}
                    />
                  }
                />

                {/* Reduced Motion Toggle */}
                <GroupedListItem
                  title="Reduced Motion"
                  subtitle="Disable dynamic physics-based spring animations"
                  className="py-3"
                  rightElement={
                    <Switch
                      checked={reducedMotion}
                      onChange={setReducedMotion}
                    />
                  }
                />
              </GroupedList>
            </div>

            {/* Done Button */}
            <button
              onClick={() => {
                playClickSound("click")
                onClose()
              }}
              className="w-full h-12 rounded-2xl bg-accent hover:opacity-90 text-white font-sans text-sm font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm shrink-0 mt-6"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
