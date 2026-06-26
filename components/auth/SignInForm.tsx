"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { signInSchema } from "@/lib/validations/auth"
import Input from "@/components/auth/Input"
import SubmitButton from "@/components/auth/SubmitButton"
import SocialAuth from "@/components/auth/SocialAuth"
import { toast } from "sonner"
import { checkCredentials } from "@/app/actions/auth"

export default function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = signInSchema.safeParse({ email, password })
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

    const check = await checkCredentials(parsed.data.email, parsed.data.password)
    if (check.error) {
      setLoading(false)
      toast.error(check.error)
      setFormError(check.error)
      return
    }

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })

    setLoading(false)

    if (!result || result.error) {
      const msg = "Sign-in failed. Please try again."
      toast.error(msg)
      setFormError(msg)
      return
    }

    toast.success("Welcome back!")
    router.push(callbackUrl)
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
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={loading}
      />

      <div className="pt-1">
        <SubmitButton loading={loading}>Sign In</SubmitButton>
      </div>

      <SocialAuth callbackUrl={callbackUrl} />
    </form>
  )
}
