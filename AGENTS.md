<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TuringType Styling & Design Guidelines (Apple HIG Style)

This project has been fully refactored to align with **Apple's Human Interface Guidelines (Apple HIG)**. Do NOT redesign layouts from scratch or introduce "AI slop" styling. Follow these specific rules:

1. **Aesthetics & Visual Tone**:
   - Clean, premium minimalism. No star footnotes, glowing bento grids, neon colors, excessive RGB gradients, or emojis in headings/UI.
   - Accent Blue is the only accent color (`--color-accent` maps to the Apple accent blue).
   - Use translucency-based text and border styling (e.g., `text-text-secondary`, `text-text-tertiary`, `border-border/10` for division lines).
   - The navigation header (`.apple-navbar`) must NEVER have a shadow or bottom border.

2. **Typography**:
   - Limit typography to exactly TWO fonts: **Inter** (UI settings, lists, headers) and **JetBrains Mono** (only for active typing displays/inputs).
   - Never use `font-extrabold` (800) or higher. Use `font-bold` (700) as the maximum weight.
   - Do NOT use `font-mono` on UI labels, table values, WPM counters, or other static text. Use standard sans-serif with `tabular-nums` for numbers.

3. **Components & Radii Guidelines**:
   - Prefer iOS-style Grouped Lists (`divide-y divide-border/10 rounded-2xl bg-surface-secondary/50 border border-border/10 overflow-hidden`) over bento-style grids.
   - Use standard iOS layout corner radii:
     - Cards, result drawer bottom sheets: `rounded-[20px]` (or `rounded-t-[38px]` for the bottom sheet drawer)
     - Segmented control containers: `rounded-[8px]` with `rounded-[6px]` for buttons
     - Dialog / CTA Buttons: `rounded-[10px]` or `rounded-2xl`
   - Every button/interactive click element must have press feedback: `active:scale-[0.97]` along with `transition-all duration-150`.

