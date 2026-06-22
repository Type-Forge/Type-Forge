import * as z from "zod"

// Shared field rules so Sign In and Sign Up stay consistent.
const email = z.email({ error: "Please enter a valid email address." }).trim().toLowerCase()

const password = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(72, { error: "Password must be at most 72 characters." })

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Password is required." }),
})

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(60, { error: "Name must be at most 60 characters." })
      .optional()
      .or(z.literal("")),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
