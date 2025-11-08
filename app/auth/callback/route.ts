import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  const origin = requestUrl.origin

  console.log("[v0] Auth callback - code:", code ? "present" : "missing")

  if (code) {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] Error exchanging code:", error)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_code_error`)
      }

      console.log("[v0] Email verified successfully for:", data.user?.email)
      console.log("[v0] Email confirmed at:", data.user?.email_confirmed_at)

      if (data.user) {
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

        if (!existingProfile) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || "",
            credits: 100,
            role: "user",
          })

          if (profileError) {
            console.error("[v0] Profile creation error:", profileError)
          } else {
            console.log("[v0] Profile created for:", data.user.email)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}?verified=true`)
    } catch (error) {
      console.error("[v0] Callback exception:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
