import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  console.log("[v0] Auth callback - code:", code ? "present" : "missing")
  console.log("[v0] Auth callback - origin:", origin)

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] Error exchanging code for session:", error)
        return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
      }

      console.log("[v0] Successfully exchanged code for session, user:", data.user?.email)
      console.log("[v0] Email confirmed:", data.user?.email_confirmed_at)

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
            console.error("[v0] Error creating profile:", profileError)
          } else {
            console.log("[v0] Profile created successfully for user:", data.user.email)
          }
        } else {
          console.log("[v0] Profile already exists for user:", data.user.email)
        }
      }

      return NextResponse.redirect(`${origin}/auth/login?verified=true`)
    } catch (error) {
      console.error("[v0] Exception during code exchange:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
