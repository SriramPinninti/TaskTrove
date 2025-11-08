import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin

  // 🔍 Log for debugging
  console.log("[Auth Callback] Incoming:", request.url)

  if (!code) {
    console.error("[Auth Callback] Missing code in URL")
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.session) {
      console.error("[Auth Callback] Code exchange failed:", error?.message)
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
    }

    console.log("✅ Email verified for user:", data.user.email)

    // ✅ Ensure user profile exists
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

    if (!existingProfile) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        credits: 100,
        role: "user",
      })

      if (insertError) console.error("[Auth Callback] Profile insert error:", insertError)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error("[Auth Callback] Unexpected error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=unexpected`)
  }
}
