import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin

  console.log("[v0] Callback - Received request")
  console.log("[v0] Callback - Code present:", !!code)

  if (!code) {
    console.error("[v0] Callback - No code provided")
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const supabase = await createClient()

  try {
    console.log("[v0] Callback - Exchanging code for session")

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] Callback - Exchange failed:", error.message)

      if (error.message.includes("expired") || error.message.includes("invalid")) {
        return NextResponse.redirect(
          `${origin}/auth/login?error=link_expired&email=${encodeURIComponent(url.searchParams.get("email") || "")}`,
        )
      }

      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
    }

    if (!data?.user) {
      console.error("[v0] Callback - No user in response")
      return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
    }

    console.log("[v0] Callback - User verified:", data.user.email)
    console.log("[v0] Callback - Email confirmed at:", data.user.email_confirmed_at)
    console.log("[v0] Callback - Session established:", !!data.session)

    if (!data.user.email_confirmed_at) {
      console.error("[v0] Callback - Email not confirmed despite successful exchange")
      return NextResponse.redirect(`${origin}/auth/login?error=email_not_confirmed`)
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      console.log("[v0] Callback - Creating new profile")
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata.full_name || "",
        credits: 100,
        role: "user",
      })

      if (insertError) {
        console.error("[v0] Callback - Profile creation failed:", insertError.message)
      }
    }

    const response = NextResponse.redirect(`${origin}/dashboard`)

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    allCookies.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    })

    console.log("[v0] Callback - Redirecting to dashboard with session")
    return response
  } catch (err) {
    console.error("[v0] Callback - Unexpected error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=unexpected`)
  }
}
