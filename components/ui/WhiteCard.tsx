import React from "react"
import { cn } from "@/lib/utils"

interface WhiteCardProps {
  children: React.ReactNode
  className?: string
}

export default function WhiteCard({ children, className = "" }: WhiteCardProps) {
  return (
    <div className={cn("divide-y divide-border/10 rounded-2xl bg-surface border border-border/10 overflow-hidden px-4 shadow-sm", className)}>
      {children}
    </div>
  )
}
