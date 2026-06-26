"use client"

import { signIn } from "next-auth/react"

// Google + GitHub sign-in buttons (iOS-style), shown above the email/password form.
// They call Auth.js OAuth sign-in; the providers only work once OAuth credentials are
// added to the env (AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET).
export default function SocialAuth({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border/15" />
        <span className="text-[12px] font-medium text-text-tertiary">or</span>
        <div className="h-px flex-1 bg-border/15" />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full h-11 flex items-center justify-center gap-2.5 rounded-[10px] bg-neutral-200 dark:bg-[#2c2c2e] dark:border-transparent shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] text-sm font-semibold text-text-primary transition-all duration-150 hover:opacity-90 active:scale-[0.97] cursor-pointer"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="w-full h-11 flex items-center justify-center gap-2.5 rounded-[10px] bg-neutral-200 dark:bg-[#2c2c2e]  dark:border-transparent shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] text-sm font-semibold text-text-primary transition-all duration-150 hover:opacity-90 active:scale-[0.97] cursor-pointer"
        >
          <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.57v-2c-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.23-3.15-.12-.3-.53-1.51.12-3.14 0 0 1-.32 3.3 1.2a11.6 11.6 0 0 1 6 0c2.28-1.52 3.29-1.2 3.29-1.2.65 1.63.24 2.84.12 3.14.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.57A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
          </svg>
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}
