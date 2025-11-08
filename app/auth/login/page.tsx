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
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")

    if (errorParam === "verification_failed") {
      setError("Email verification failed. Please try again or contact support.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      console.log("[v0] Attempting login for:", email)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.log("[v0] Login error:", authError.message)

        if (authError.message.includes("Email not confirmed")) {
          setError(
            "Please verify your email before logging in. Check your inbox for the verification link or click below to resend.",
          )
          setIsLoading(false)
          return
        }

        throw authError
      }

      console.log("[v0] Login successful, user:", authData.user?.email)
      console.log("[v0] Email confirmed at:", authData.user?.email_confirmed_at)

      router.push("/dashboard")
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("[v0] Login error caught:", error.message)

        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.")
        } else if (!error.message.includes("Email not confirmed")) {
          setError(error.message || "Failed to login")
        }
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

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess("Verification email sent! Please check your inbox.")
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Failed to resend verification email")
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
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                    {error.includes("verify your email") && (
                      <Button
                        type="button"
                        variant="link"
                        className="mt-2 h-auto p-0 text-sm text-red-700 underline"
                        onClick={handleResendVerification}
                        disabled={isLoading}
                      >
                        Resend verification email
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
