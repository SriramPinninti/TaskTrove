import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email)

    if (authError || !authUser) {
      return Response.json({ error: "User not found" }, { status: 400 })
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.user.id, {
      password: password,
    })

    if (updateError) {
      throw updateError
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return Response.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
