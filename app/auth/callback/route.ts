import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    console.error("No code provided in the verification link.");
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = createClient();

  try {
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code:", error);
      return NextResponse.redirect(`${origin}/auth/login?error=link_expired`);
    }

    if (data?.user) {
      console.log("✅ Email verified successfully for:", data.user.email);

      // Optional: create user profile if missing
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          credits: 100,
          role: "user",
        });
      }

      // Redirect to dashboard after successful verification
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  } catch (err) {
    console.error("Unexpected error during callback:", err);
    return NextResponse.redirect(`${origin}/auth/login?error=unexpected`);
  }

  // Fallback if no user data
  return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
}
