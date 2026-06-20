import Link from "next/link"

/**
 * Centered header logo link.
 * Styled as text-base, font-heading, font-semibold.
 */
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-0 hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer">
      <span className="font-sans text-base font-semibold text-accent">
        Type
      </span>
      <span className="font-sans text-base font-semibold text-text-primary">
        Forge
      </span>
    </Link>
  )
}
