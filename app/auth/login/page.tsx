"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    const verifiedParam = searchParams.get("verified")
    const emailParam = searchParams.get("email")

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }

    if (errorParam === "link_expired") {
      setError("Email verification link has expired. Please request a new one below.")
      setShowResend(true)
    } else if (errorParam === "verification_failed") {
      setError("Email verification failed. Please try again or contact support.")
      setShowResend(true)
    } else if (errorParam === "email_not_confirmed") {
      setError("Email confirmation incomplete. Please check your inbox and click the verification link.")
      setShowResend(true)
    } else if (errorParam === "missing_code" || errorParam === "no_user") {
      setError("Invalid verification link. Please request a new one.")
      setShowResend(true)
    } else if (errorParam === "unexpected") {
      setError("Something went wrong. Please try again or contact support.")
    }

    if (verifiedParam === "true") {
      setSuccess("Email verified successfully! You can now login.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setShowResend(false)

    try {
      const supabase = createClient()

      console.log("[v0] Login - Attempting login for:", email)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("[v0] Login - Error:", authError.message)

        if (
          authError.message.toLowerCase().includes("email not confirmed") ||
          authError.message.toLowerCase().includes("email confirmation")
        ) {
          setError("Please verify your email address before logging in. Check your inbox for the verification link.")
          setShowResend(true)
          setIsLoading(false)
          return
        }

        if (authError.message.toLowerCase().includes("invalid login credentials")) {
          setError("Invalid email or password. Please try again.")
          setIsLoading(false)
          return
        }

        throw authError
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.error("[v0] Login - Email not confirmed despite successful login")
        await supabase.auth.signOut()
        setError("Please verify your email address before logging in. Check your inbox for the verification link.")
        setShowResend(true)
        setIsLoading(false)
        return
      }

      console.log("[v0] Login - Success! User:", data.user?.email)
      console.log("[v0] Login - Email confirmed at:", data.user?.email_confirmed_at)
      console.log("[v0] Login - Redirecting to dashboard")

      router.refresh()
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error("[v0] Login - Unexpected error:", error)
      if (error instanceof Error) {
        setError(error.message || "An unexpected error occurred")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      console.log("[v0] Resending verification email to:", email)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("[v0] Resend error:", error)
        throw error
      }

      setSuccess("Verification email sent! Please check your inbox and click the link to verify your account.")
      setShowResend(false)
    } catch (error: unknown) {
      console.error("[v0] Resend failed:", error)
      if (error instanceof Error) {
        setError(error.message || "Failed to resend verification email")
      } else {
        setError("Failed to resend verification email. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-white p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-teal-600">TaskTrove</h1>
          <p className="text-sm text-gray-600">Campus Errand Platform</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Sign in to your TaskTrove account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@thapar.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>}
                {error && (
                  <div className="space-y-2 rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                    {showResend && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={handleResendVerification}
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Resend Verification Email"}
                      </Button>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 space-y-2 text-center text-sm">
                <div>
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="text-teal-600 hover:underline">
                    Sign up
                  </Link>
                </div>
                <div>
                  <Link href="/auth/forgot-password" className="text-teal-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
