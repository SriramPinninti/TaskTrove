"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
        needsVerification: true,
      }
    } else if (error.message.includes("Invalid login credentials")) {
      return {
        error: "Invalid email or password. Please check your credentials and try again.",
      }
    }
    return { error: error.message }
  }

  redirect("/dashboard")
}
