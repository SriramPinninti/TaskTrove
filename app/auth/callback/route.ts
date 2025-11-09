import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const type = url.searchParams.get("type")
  const origin = url.origin

  console.log("[v0] Auth callback - Type:", type, "Code present:", !!code)

  if (!code) {
    console.error("[v0] Auth callback - Missing code parameter")
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.session) {
      console.error("[v0] Auth callback - Code exchange failed:", error?.message)
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`)
    }

    console.log("[v0] Auth callback - Session created successfully for user:", data.user.id)

    if (type === "recovery") {
      console.log("[v0] Auth callback - Password recovery flow detected, redirecting to reset-password")
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

    if (!existingProfile) {
      console.log("[v0] Auth callback - Creating new profile for user:", data.user.id)
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        credits: 100,
        role: "user",
      })
    }

    console.log("[v0] Auth callback - Email verification successful, redirecting to dashboard")
    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error("[v0] Auth callback - Unexpected error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
  }
}
