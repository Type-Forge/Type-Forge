import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import FriendsView from "./FriendsView"

export const dynamic = "force-dynamic"

export default async function FriendsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/signin")
  }

  return <FriendsView />
}
