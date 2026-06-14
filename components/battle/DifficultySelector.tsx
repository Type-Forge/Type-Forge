"use client"

import { motion } from "motion/react"
import type { BattleDifficulty } from "@/types"

interface DifficultySelectorProps {
  onSelect: (difficulty: BattleDifficulty) => void
}

/**
 * DifficultySelector displays speed cards for Easy, Medium, and Hard configurations.
 * Adheres to minimal, lowercase visual styles with press animations.
 */
export default function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  const options: { diff: BattleDifficulty; wpm: number; description: string }[] = [
    {
      diff: "easy",
      wpm: 35,
      description: "simulation speed set to slow. suitable for decryption practice.",
    },
    {
      diff: "medium",
      wpm: 60,
      description: "standard bletchley operational pace. a solid race.",
    },
    {
      diff: "hard",
      wpm: 90,
      description: "elite enigma machine rotor sync. speeds running hot!",
    },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-6 font-sans select-none">
      <div className="text-center mb-2">
        <h2 className="text-xl font-heading font-bold text-text-primary mb-1">
          configure enigma speed
        </h2>
        <p className="text-xs text-text-secondary">
          select simulated rotor decryption speeds to race against the cipher
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => (
          <motion.button
            key={opt.diff}
            onClick={() => onSelect(opt.diff)}
            whileHover={{ y: -3 }}
            className="flex flex-col items-center text-center p-6 bg-surface border border-border rounded-xl cursor-pointer hover:border-accent hover:bg-surface-hover/50 transition-[transform,colors,border-color] active:scale-[0.97] duration-150"
          >
            <span className="text-[10px] uppercase font-heading font-bold tracking-widest text-text-muted mb-2">
              {opt.diff}
            </span>
            <span className="text-4xl font-heading font-bold text-accent mb-2">
              {opt.wpm} <span className="text-xs font-mono text-text-muted">wpm</span>
            </span>
            <p className="text-xs text-text-secondary leading-relaxed mt-2 font-light">
              {opt.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
