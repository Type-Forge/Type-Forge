import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import type { Provider } from "next-auth/providers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signInSchema } from "@/lib/validations/auth"

// Social providers are only enabled when their OAuth credentials exist in the env,
// so the app runs fine without them. Auth.js auto-reads AUTH_GOOGLE_ID/SECRET and
// AUTH_GITHUB_ID/SECRET. These sign in via the JWT session (no DB row is created).
const socialProviders: Provider[] = []
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  socialProviders.push(Google)
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  socialProviders.push(GitHub)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials provider only supports JWT sessions (not the database strategy).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    ...socialProviders,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        // Returned object is persisted into the JWT (never the password hash).
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        }
      },
    }),
  ],
  callbacks: {
    // Persist the user id (and username) onto the token, then expose on the session.
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.username = (user as { username?: string | null }).username ?? null
      }
      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = (token.username as string | null) ?? null
      }
      return session
    },
  },
})
