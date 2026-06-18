import React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: "4xl" | "6xl" | "7xl" | "full"
}

/**
 * Centered responsive layout container.
 * Supports size="4xl", size="6xl", size="7xl", and size="full".
 */
export default function Container({ children, className, size = "4xl" }: ContainerProps) {
  let sizeClass = "mx-auto max-w-4xl px-6 md:px-8"
  if (size === "full") {
    sizeClass = "w-full px-6 md:px-8"
  } else if (size === "6xl") {
    sizeClass = "mx-auto max-w-6xl px-6 md:px-8"
  } else if (size === "7xl") {
    sizeClass = "mx-auto max-w-7xl px-6 md:px-8"
  }
  
  return (
    <div className={cn(sizeClass, className || "")}>
      {children}
    </div>
  )
}
