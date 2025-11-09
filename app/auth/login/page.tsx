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
  const [isLoading, setIsLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlEmail = searchParams.get("email")

    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail))
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setShowResend(false)

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (
          authError.message.toLowerCase().includes("email not confirmed") ||
          authError.message.toLowerCase().includes("confirm your email")
        ) {
          setError("Please verify your email address before logging in. Check your inbox for the verification link.")
          setShowResend(true)
        } else if (authError.message.toLowerCase().includes("invalid")) {
          setError("Invalid email or password. Please try again.")
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "An unexpected error occurred")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
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

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setError(null)
      alert("Verification email sent! Please check your inbox and click the link to verify your account.")
      setShowResend(false)
    } catch (error: unknown) {
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
                {error && (
                  <div
                    className={`space-y-2 rounded-md p-3 ${
                      error.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    }`}
                  >
                    <p className="text-sm">{error}</p>
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
