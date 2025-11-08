/**
 * Helper utilities for database reset operations
 * These are utility functions to assist with testing and verification
 */

import { createClient } from "@/lib/supabase/server"

/**
 * Check if database is in a clean state (all tables empty)
 * Use this in tests or admin pages to verify reset was successful
 */
export async function verifyDatabaseCleanState() {
  const supabase = await createClient()

  try {
    const checks = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("ratings").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("id", { count: "exact", head: true }),
      supabase.from("task_requests").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }),
      supabase.from("password_reset_tokens").select("id", { count: "exact", head: true }),
    ])

    const results = {
      profiles: checks[0].count || 0,
      tasks: checks[1].count || 0,
      messages: checks[2].count || 0,
      ratings: checks[3].count || 0,
      transactions: checks[4].count || 0,
      task_requests: checks[5].count || 0,
      notifications: checks[6].count || 0,
      password_reset_tokens: checks[7].count || 0,
    }

    const totalRows = Object.values(results).reduce((sum, count) => sum + count, 0)
    const isClean = totalRows === 0

    return {
      isClean,
      totalRows,
      details: results,
      message: isClean ? "✅ Database is clean and ready for testing" : `⚠️ Database has ${totalRows} rows remaining`,
    }
  } catch (error) {
    console.error("[v0] Error checking database state:", error)
    return {
      isClean: false,
      totalRows: -1,
      details: {},
      message: "❌ Error checking database state",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get count of auth users (requires admin access)
 * This can only be called from server-side code with service role
 */
export async function getAuthUserCount() {
  // Note: This requires service role key to access auth.users
  // For testing, use the Supabase dashboard or API with service role key
  console.warn("[v0] Auth user count requires service role access")
  return {
    message: "Check auth.users count via Supabase dashboard SQL Editor",
    suggestion: "Run: SELECT COUNT(*) FROM auth.users;",
  }
}

/**
 * Test email verification flow
 * Returns steps to manually test the verification process
 */
export function getEmailVerificationTestSteps() {
  return {
    steps: [
      {
        step: 1,
        action: "Sign up new user",
        url: "/auth/signup",
        expected: "Verification email sent message displayed",
      },
      {
        step: 2,
        action: "Check email inbox",
        expected: "Email from TaskTrove with verification link",
      },
      {
        step: 3,
        action: "Click verification link",
        expected: "Redirected to dashboard, user logged in automatically",
      },
      {
        step: 4,
        action: "Test login after verification",
        url: "/auth/login",
        expected: "Login successful without errors",
      },
      {
        step: 5,
        action: "Sign up another user (don't verify)",
        url: "/auth/signup",
        expected: "New user created",
      },
      {
        step: 6,
        action: "Try to login unverified user",
        url: "/auth/login",
        expected: "Error: Email not confirmed. Resend option available.",
      },
    ],
    verificationPoints: [
      "Verification email arrives within 1 minute",
      "Verification link redirects to https://axodojo.xyz/auth/callback",
      "After callback, user is redirected to dashboard with active session",
      "Verified users can login without email confirmation errors",
      "Unverified users see appropriate error messages",
    ],
  }
}
