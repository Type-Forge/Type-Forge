"use client"

import { SessionProvider } from "next-auth/react"
import { useSyncOnLogin } from "@/hooks/useSyncOnLogin"

// Makes the Auth.js session available to client components via useSession/useAuth.
// Also triggers data sync (localStorage ↔ DB) when the user logs in.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SyncBridge />
      {children}
    </SessionProvider>
  )
}

// Separate component so useSyncOnLogin can access session context.
function SyncBridge() {
  useSyncOnLogin()
  return null
}
