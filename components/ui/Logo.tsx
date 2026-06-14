import Link from "next/link"

/**
 * Centered header logo link.
 * Styled as text-base, font-heading, font-semibold.
 */
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-0 hover:opacity-90 transition-opacity cursor-pointer">
      <span className="font-heading text-base font-semibold text-accent">
        Turing
      </span>
      <span className="font-heading text-base font-semibold text-text-primary">
        Type
      </span>
    </Link>
  )
}
