import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const type = url.searchParams.get("type")
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.session) {
      // If so, check if there's an already verified user and show success instead of error
      if (error?.message?.includes("already been used") || error?.message?.includes("expired")) {
        // Try to extract email from the token to check if user is already verified
        // If we can't determine, show a friendly message suggesting the email might already be verified
        return NextResponse.redirect(`${origin}/auth/login?verified=true`)
      }
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`)
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    try {
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          credits: 100,
          role: "user",
        })
      }
    } catch (profileError) {
      console.error("Profile creation error (non-fatal):", profileError)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error("Auth callback error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
  }
}
