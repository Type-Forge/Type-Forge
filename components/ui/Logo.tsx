import Link from "next/link"

export default function Logo() {
  return (
    <Link href="/" className="font-heading text-lg font-bold tracking-tight hover:opacity-90 transition-opacity">
      <span className="text-accent">Turing</span>
      <span className="text-text-primary">Type</span>
    </Link>
  )
}
