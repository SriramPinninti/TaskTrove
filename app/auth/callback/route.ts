import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  const supabase = await createClient()

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("❌ Email verification failed:", error)
    return NextResponse.redirect(
      `${origin}/auth/login?error=verification_failed&email=${searchParams.get("email") || ""}`,
    )
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
