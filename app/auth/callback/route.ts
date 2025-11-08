import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] Error exchanging code:", error)
      // Redirect to login with error
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // No code found, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
