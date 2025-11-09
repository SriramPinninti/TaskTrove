import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const type = url.searchParams.get("type")
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const errorMessage = error.message?.toLowerCase() || ""

      // Check if the token has already been used or is expired
      if (
        errorMessage.includes("already been used") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("pkce") ||
        error.status === 400
      ) {
        return NextResponse.redirect(`${origin}/auth/login`)
      }

      return NextResponse.redirect(`${origin}/auth/login`)
    }

    if (!data?.session) {
      return NextResponse.redirect(`${origin}/auth/login`)
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
    return NextResponse.redirect(`${origin}/auth/login`)
  }
}
