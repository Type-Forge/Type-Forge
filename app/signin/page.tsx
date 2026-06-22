import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import AuthShell from "@/components/auth/AuthShell"
import SignInForm from "@/components/auth/SignInForm"

export const metadata: Metadata = {
  title: "Sign In — TypeForge",
}

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to sync your typing stats and history."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent font-semibold hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      {/* useSearchParams requires a Suspense boundary in Next.js. */}
      <Suspense fallback={<div className="h-[200px]" />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  )
}
