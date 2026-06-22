"use client"

// Accent CTA button with loading spinner and Apple-style press feedback.
export default function SubmitButton({
  loading,
  children,
}: {
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-[10px] bg-accent text-white text-sm font-semibold py-2.5 flex items-center justify-center gap-2 transition-all duration-150 hover:bg-accent-hover active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100 cursor-pointer"
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
