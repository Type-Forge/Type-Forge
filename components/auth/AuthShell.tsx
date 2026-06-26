import Link from "next/link"

// Shared visual shell for the Sign In / Sign Up pages — keeps both pages consistent
// and aligned with the app's Apple-HIG styling.
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10 animate-fade-in select-none">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-[15px] font-bold tracking-tight text-text-primary"
          >
            TypeForge
          </Link>
          <h1 className="mt-6 text-[26px] font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
        </div>

        <div className="rounded-[20px] bg-surface border border-border/10 shadow-sm p-6">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">{footer}</p>
      </div>
    </div>
  )
}
