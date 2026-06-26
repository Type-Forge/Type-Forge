import Link from "next/link"
import type { Metadata } from "next"
import AuthShell from "@/components/auth/AuthShell"
import SignUpForm from "@/components/auth/SignUpForm"

export const metadata: Metadata = {
  title: "Sign Up — TypeForge",
}

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Track your progress and compete on future leaderboards."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  )
}
