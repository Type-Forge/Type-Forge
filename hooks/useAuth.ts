"use client"

import { useSession, signIn, signOut } from "next-auth/react"

// Thin, reusable wrapper around Auth.js so UI components don't import next-auth directly.
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signIn,
    signOut,
  }
}
