import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server" // Fixed import from next/server instead of next/headers

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } else {
      console.error("[v0] Callback error:", error.message)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=verification_failed`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}
