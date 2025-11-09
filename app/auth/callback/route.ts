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
      // Profile creation failed but verification succeeded - still redirect to dashboard
      console.error("Profile creation error (non-fatal):", profileError)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error("Auth callback error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
  }
}
