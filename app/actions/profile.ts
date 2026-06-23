"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getProfileData() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // Fetch user details with fallback for unmigrated social fields
    let userRecord: any = null
    try {
      userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          createdAt: true,
          bestScore: true,
          githubUrl: true,
          twitterUrl: true,
          websiteUrl: true,
        },
      })
    } catch (err) {
      // Fallback if schema is modified but DB migration is not yet applied
      userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          createdAt: true,
          bestScore: true,
        },
      })
      if (userRecord) {
        userRecord.githubUrl = null
        userRecord.twitterUrl = null
        userRecord.websiteUrl = null
      }
    }

    if (!userRecord) {
      return { success: false, error: "User not found" }
    }

    // Calculate Leaderboard Rank
    let rank: number | null = null
    if (userRecord.bestScore > 0) {
      const higherCount = await prisma.user.count({
        where: {
          bestScore: { gt: userRecord.bestScore },
        },
      })
      rank = higherCount + 1
    }

    return { success: true, user: userRecord, rank }
  } catch (error: any) {
    console.error("Error fetching profile data:", error)
    return { success: false, error: error?.message || "Internal server error" }
  }
}

interface UpdateProfileInput {
  name?: string | null
  username?: string | null
  image?: string | null
  githubUrl?: string | null
  twitterUrl?: string | null
  websiteUrl?: string | null
}

export async function updateProfileData(data: UpdateProfileInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // Validate unique username if changed
    if (data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      })
      if (existing && existing.id !== userId) {
        return { success: false, error: "Username is already taken" }
      }
    }

    // Update user details with fallback for unmigrated social fields
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          username: data.username,
          image: data.image,
          githubUrl: data.githubUrl,
          twitterUrl: data.twitterUrl,
          websiteUrl: data.websiteUrl,
        },
      })
    } catch (err) {
      // Fallback: update only existing columns
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          username: data.username,
          image: data.image,
        },
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating profile data:", error)
    return { success: false, error: error?.message || "Internal server error" }
  }
}

interface UpdatePasswordInput {
  currentPassword?: string
  newPassword?: string
}

export async function updatePassword(data: UpdatePasswordInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // If user has a password, verify the current one
    if (user.passwordHash) {
      if (!data.currentPassword) {
        return { success: false, error: "Current password is required" }
      }
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
      if (!valid) {
        return { success: false, error: "Incorrect current password" }
      }
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters" }
    }

    const newHash = await bcrypt.hash(data.newPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error updating password:", error)
    return { success: false, error: error?.message || "Internal server error" }
  }
}
