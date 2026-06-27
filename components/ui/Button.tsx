"use client"

import React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { HTMLMotionProps } from "motion/react"

interface ButtonProps extends HTMLMotionProps<"button"> {
  layoutId?: string
  variant?: "primary" | "secondary"
}

export default function Button({
  children,
  className,
  layoutId,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary"

  return (
    <motion.button
      type={type}
      layoutId={layoutId}
      className={cn(
        "px-5 py-2 rounded-[10px] font-sans text-xs font-bold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none flex items-center justify-center shrink-0 shadow-sm",
        isPrimary
          ? "bg-[#007aff] dark:bg-[#0a84ff] text-white hover:opacity-90"
          : "bg-surface-secondary/40 border border-border/10 text-text-primary hover:bg-surface-hover",
        className
      )}
      style={{ borderRadius: "10px" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
