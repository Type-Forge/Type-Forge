import Link from "next/link"
import Image from "next/image"

/**
 * Header logo link containing the custom keycap icon and theme-aware text.
 */
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-0 hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer select-none">
      <div className="relative w-11 h-10 shrink-0 -mr-1.5 -translate-y-[2px]">
        <Image
          src="/typeforge-logo.png"
          alt="TypeForge Logo Icon"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span className="font-sans text-[17px] font-bold text-text-primary tracking-tight select-none leading-none">
        TypeForge
      </span>
    </Link>
  )
}
