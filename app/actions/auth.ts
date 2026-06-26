"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function checkCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    return { error: "No account found with this email address." } as const
  }

  if (!user.passwordHash) {
    return {
      error:
        "This account was created with Google/GitHub sign-in. Please use social login or set a password from your profile settings.",
    } as const
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: "Incorrect password. Please try again." } as const
  }

  return { error: null } as const
}
