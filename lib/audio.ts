/**
 * Synthesizes mechanical keyboard click sounds dynamically using the Web Audio API.
 * Provides high-performance, low-latency sounds offline without loading static assets.
 */

let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (sharedCtx) return sharedCtx

  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null

    sharedCtx = new AudioContextClass()
    return sharedCtx
  } catch {
    return null
  }
}

export function playClickSound(key: string) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === "suspended") {
      void ctx.resume()
    }

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    if (key === " ") {
      // Deeper "thock" sound for Spacebar
      osc1.type = "sine"
      osc1.frequency.setValueAtTime(350, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08)

      osc2.type = "triangle"
      osc2.frequency.setValueAtTime(180, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.06)

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)

      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.08)
      osc2.stop(ctx.currentTime + 0.08)
    } else if (key === "Backspace") {
      // Slightly lower return click for Backspace
      osc1.type = "sine"
      osc1.frequency.setValueAtTime(700, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06)

      osc2.type = "triangle"
      osc2.frequency.setValueAtTime(350, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06)

      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.06)
      osc2.stop(ctx.currentTime + 0.06)
    } else {
      // Crisp key click for standard letters
      osc1.type = "sine"
      osc1.frequency.setValueAtTime(1100, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.05)

      osc2.type = "triangle"
      osc2.frequency.setValueAtTime(550, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04)

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05)

      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.05)
      osc2.stop(ctx.currentTime + 0.05)
    }
  } catch {
    // Fail silently if audio context cannot play
  }
}
