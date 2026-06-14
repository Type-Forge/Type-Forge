"use client"

import { motion } from "motion/react"
import type { BattleDifficulty } from "@/types"

interface DifficultySelectorProps {
  onSelect: (difficulty: BattleDifficulty) => void
}

/**
 * Renders Easy, Medium, and Hard cards for Battle Mode.
 * Triggers interactive lift/hover motion vectors.
 */
export default function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  const options: { diff: BattleDifficulty; wpm: number; description: string }[] = [
    {
      diff: "easy",
      wpm: 35,
      description: "Simulation speed set to slow. Suitable for decryption practice.",
    },
    {
      diff: "medium",
      wpm: 60,
      description: "Standard Bletchley Park operational pace. A solid race.",
    },
    {
      diff: "hard",
      wpm: 90,
      description: "Elite Enigma machine operation. Rotor sync speeds running hot!",
    },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-6 font-sans">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-1">
          Configure Enigma Speed
        </h2>
        <p className="text-sm text-text-secondary">
          Select simulated rotor decryption speeds to race against the German Enigma cipher.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => (
          <motion.button
            key={opt.diff}
            onClick={() => onSelect(opt.diff)}
            whileHover={{ y: -4 }}
            className="flex flex-col items-center text-center p-6 bg-surface border border-border rounded-xl cursor-pointer hover:border-accent transition-all duration-200"
          >
            <span className="text-[10px] uppercase font-heading font-bold tracking-widest text-text-muted mb-2">
              {opt.diff}
            </span>
            <span className="text-4xl font-heading font-bold text-accent mb-2">
              {opt.wpm} <span className="text-xs font-mono text-text-muted">WPM</span>
            </span>
            <p className="text-xs text-text-secondary leading-relaxed mt-2">
              {opt.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
