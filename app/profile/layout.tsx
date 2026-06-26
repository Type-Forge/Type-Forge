import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

// Authoritative server-side guard for /profile (and any nested routes).
// proxy.ts does a fast optimistic redirect; this verifies the session for real.
export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) {
    redirect("/signin?callbackUrl=/profile")
  }
  return <>{children}</>
}
