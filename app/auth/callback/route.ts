import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"

  console.log("[v0] Callback invoked with code:", code ? "present" : "missing")

  if (!code) {
    console.error("[v0] No code provided in callback")
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  console.log("[v0] Exchanging code for session...")
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[v0] Exchange code error:", error.message)
    return NextResponse.redirect(
      `${origin}/auth/login?error=verification_failed&email=${encodeURIComponent(searchParams.get("email") || "")}`,
    )
  }

  console.log("[v0] ✅ Email verified successfully for user:", data.user?.email)
  console.log("[v0] Email confirmed at:", data.user?.email_confirmed_at)

  return NextResponse.redirect(`${origin}${next}`)
}
