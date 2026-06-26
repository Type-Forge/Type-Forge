"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { signUpSchema } from "@/lib/validations/auth"
import Input from "@/components/auth/Input"
import SubmitButton from "@/components/auth/SubmitButton"
import SocialAuth from "@/components/auth/SocialAuth"
import { toast } from "sonner"

export default function SignUpForm() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = signUpSchema.safeParse({ name, email, password, confirmPassword })
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setLoading(true)

    // 1. Create the account.
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      const msg = data.error ?? "Something went wrong. Please try again."
      toast.error(msg)
      setFormError(msg)
      return
    }

    // 2. Immediately sign the new user in.
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })

    setLoading(false)

    if (!result || result.error) {
      toast.error("Account created but sign-in failed. Please sign in manually.")
      router.push("/signin")
      return
    }

    toast.success("Account created! Welcome to TypeForge!")
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <div className="rounded-[10px] bg-incorrect/10 border border-incorrect/30 px-3.5 py-2.5 text-[13px] text-incorrect font-medium">
          {formError}
        </div>
      )}

      <Input
        id="name"
        label="Name (optional)"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        autoComplete="name"
        placeholder="Ada Lovelace"
        disabled={loading}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={fieldErrors.email}
        autoComplete="email"
        placeholder="you@example.com"
        disabled={loading}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        error={fieldErrors.password}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        disabled={loading}
      />
      <Input
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={fieldErrors.confirmPassword}
        autoComplete="new-password"
        placeholder="Re-enter your password"
        disabled={loading}
      />

      <div className="pt-1">
        <SubmitButton loading={loading}>Create Account</SubmitButton>
      </div>

      <SocialAuth callbackUrl="/" />
    </form>
  )
}
