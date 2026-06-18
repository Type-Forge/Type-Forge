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
      description: "Simulation speed set to slow. Suitable for decryption practice.",
    },
    {
      diff: "medium",
      wpm: 60,
      description: "Standard Bletchley operational pace. A solid race.",
    },
    {
      diff: "hard",
      wpm: 90,
      description: "Elite Enigma machine rotor sync. Speeds running hot!",
    },
  ]

  return (
    <div className="w-full mx-auto flex flex-col gap-4 pt-1 pb-4 font-sans select-none">
      <div className="text-center">
        <h2 className="text-xl font-sans font-bold text-text-primary mb-1">
          Configure Enigma speed
        </h2>
        <p className="text-xs text-text-secondary">
          Select simulated rotor decryption speeds to race against the cipher.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => (
          <button
            key={opt.diff}
            onClick={() => onSelect(opt.diff)}
            className="flex flex-col items-center text-center p-6 bg-surface-secondary/40 border border-border/10 rounded-[20px] cursor-pointer hover:border-border-strong hover:bg-surface-hover/50 transition-all active:scale-[0.97] duration-150"
          >
            <span className="text-xs font-semibold text-text-secondary tracking-wide mb-2">
              {opt.diff.charAt(0).toUpperCase() + opt.diff.slice(1)}
            </span>
            <span className="text-3xl font-sans font-bold text-accent mb-2">
              {opt.wpm} <span className="text-xs font-sans text-text-muted">WPM</span>
            </span>
            <p className="text-xs text-text-secondary leading-relaxed mt-2 font-light">
              {opt.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
