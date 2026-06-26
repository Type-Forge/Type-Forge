"use client"

import { SessionProvider } from "next-auth/react"

// Makes the Auth.js session available to client components via useSession/useAuth.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
