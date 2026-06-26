import type { DefaultSession } from "next-auth"

// Augment the Auth.js session/user/token with our custom fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    username?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    username?: string | null
  }
}
