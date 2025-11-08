import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("❌ No verification code found in URL");
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  try {
    const supabase = createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.session) {
      console.error("❌ Verification failed:", error?.message);
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
    }

    console.log("✅ Email verified for user:", data.user.email);

    // Confirm the user actually exists or create a profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile && !profileError) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        credits: 100,
        role: "user",
      });
    }

    // Redirect to dashboard after successful verification
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err) {
    console.error("⚠️ Unexpected error during callback:", err);
    return NextResponse.redirect(`${origin}/auth/login?error=unexpected`);
  }
}
