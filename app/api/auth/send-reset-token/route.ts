import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = await createClient()

    console.log("[v0] Attempting to send OTP to:", email)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error("[v0] OTP send error:", error.message, error.code)
      // For security and UX, return success anyway (OTP sent or user not found)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[v0] OTP sent successfully to:", email)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error in send-reset-token:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Full error:", error)
    return new Response(JSON.stringify({ error: "Failed to send reset code" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
