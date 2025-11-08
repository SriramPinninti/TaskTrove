import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = createClient();

  console.log("🧩 Callback hit with code:", code);

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.log("✅ Exchange result:", { data, error });

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
  }

  console.log("🎉 User verified:", data.user);

  return NextResponse.redirect(`${origin}/dashboard`);
}
