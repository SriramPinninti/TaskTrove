import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email, tempPassword } = await request.json()

    if (!email || !tempPassword) {
      return Response.json({ error: "Email and temporary password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email)

    if (authError || !authUser) {
      return Response.json({ error: "Invalid email or temporary password" }, { status: 400 })
    }

    const { data: resetToken, error: queryError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("user_id", authUser.user.id)
      .eq("temporary_password", tempPassword)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (queryError || !resetToken) {
      return Response.json({ error: "Invalid or expired temporary password" }, { status: 400 })
    }

    await supabase.from("password_reset_tokens").update({ used: true }).eq("id", resetToken.id)

    return Response.json({ resetToken: resetToken.id })
  } catch (error) {
    console.error("Error verifying temp password:", error)
    return Response.json({ error: "Failed to verify temporary password" }, { status: 500 })
  }
}
