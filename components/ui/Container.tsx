import React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Centered responsive layout container.
 */
export default function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto max-w-3xl px-6 md:px-8", className || "")}>
      {children}
    </div>
  )
}
