import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.session) {
      console.error("[Auth Callback] Code exchange failed:", error?.message)
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`)
    }

    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        credits: 100,
        role: "user",
      })
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error("[Auth Callback] Unexpected error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
  }
}
