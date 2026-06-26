"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function sendFriendRequest(targetUserId: string) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    if (userId === targetUserId) {
      return { success: false, error: "Cannot send a friend request to yourself" }
    }

    // Check if they are already friends
    const [u1, u2] = [userId, targetUserId].sort()
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId: u1,
          userTwoId: u2,
        },
      },
    })
    if (existingFriendship) {
      return { success: false, error: "You are already friends with this user" }
    }

    // Check if a request already exists in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    })

    if (existingRequest) {
      if (existingRequest.senderId === userId) {
        return { success: false, error: "Friend request already sent" }
      } else {
        return { success: false, error: "You have a pending request from this user" }
      }
    }

    await prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: targetUserId,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error sending friend request:", error)
    return { success: false, error: error?.message || "Failed to send friend request" }
  }
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!request || (request.receiverId !== userId && request.senderId !== userId)) {
      return { success: false, error: "Friend request not found or unauthorized" }
    }

    if (accept) {
      const [u1, u2] = [request.senderId, request.receiverId].sort()
      
      // Use transaction to ensure both operations succeed together
      await prisma.$transaction([
        prisma.friendship.create({
          data: {
            userOneId: u1,
            userTwoId: u2,
          },
        }),
        prisma.friendRequest.delete({
          where: { id: requestId },
        }),
      ])
    } else {
      await prisma.friendRequest.delete({
        where: { id: requestId },
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error responding to friend request:", error)
    return { success: false, error: error?.message || "Failed to respond to friend request" }
  }
}

export async function removeFriend(friendId: string) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const [u1, u2] = [userId, friendId].sort()
    
    await prisma.friendship.deleteMany({
      where: {
        userOneId: u1,
        userTwoId: u2,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error removing friend:", error)
    return { success: false, error: error?.message || "Failed to remove friend" }
  }
}

export async function getFriendsList() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userOneId: userId },
          { userTwoId: userId },
        ],
      },
      include: {
        userOne: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    const friends = friendships.map((f) => {
      return f.userOneId === userId ? f.userTwo : f.userOne
    })

    return { success: true, friends }
  } catch (error: any) {
    console.error("Error getting friends list:", error)
    return { success: false, error: error?.message || "Failed to fetch friends" }
  }
}

export async function getPendingRequests() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return { success: true, requests }
  } catch (error: any) {
    console.error("Error getting pending requests:", error)
    return { success: false, error: error?.message || "Failed to fetch pending requests" }
  }
}

export async function getFriendshipStatus(targetUserId: string) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: true, status: "none" }
    }

    if (userId === targetUserId) {
      return { success: true, status: "self" }
    }

    // Check Friendship
    const [u1, u2] = [userId, targetUserId].sort()
    const friendship = await prisma.friendship.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId: u1,
          userTwoId: u2,
        },
      },
    })

    if (friendship) {
      return { success: true, status: "friends" }
    }

    // Check Sent Request
    const sentReq = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: targetUserId,
        },
      },
    })
    if (sentReq) {
      return { success: true, status: "pending_sent" }
    }

    // Check Received Request
    const recReq = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: targetUserId,
          receiverId: userId,
        },
      },
    })
    if (recReq) {
      return { success: true, status: "pending_received", requestId: recReq.id }
    }

    return { success: true, status: "none" }
  } catch (error: any) {
    console.error("Error getting friendship status:", error)
    return { success: false, error: error?.message || "Failed to fetch status" }
  }
}

export async function getSocialRelationsMap() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: true, relations: {} }
    }

    const [friendships, sent, received] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [
            { userOneId: userId },
            { userTwoId: userId },
          ],
        },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: userId },
      }),
      prisma.friendRequest.findMany({
        where: { receiverId: userId },
      }),
    ])

    const relations: Record<
      string,
      { status: "friends" | "pending_sent" | "pending_received"; requestId?: string }
    > = {}

    friendships.forEach((f) => {
      const friendId = f.userOneId === userId ? f.userTwoId : f.userOneId
      relations[friendId] = { status: "friends" }
    })

    sent.forEach((r) => {
      relations[r.receiverId] = { status: "pending_sent" }
    })

    received.forEach((r) => {
      relations[r.senderId] = { status: "pending_received", requestId: r.id }
    })

    return { success: true, relations }
  } catch (error: any) {
    console.error("Error building relations map:", error)
    return { success: false, error: error?.message || "Failed to fetch relations map" }
  }
}

export async function searchUsers(query: string) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    if (!query || query.trim().length === 0) {
      return { success: true, users: [] }
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
          { id: { not: userId } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      take: 10,
    })

    return { success: true, users }
  } catch (error: any) {
    console.error("Error searching users:", error)
    return { success: false, error: error?.message || "Failed to search users" }
  }
}


