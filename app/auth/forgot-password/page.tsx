"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const redirectUrl = `${window.location.origin}/auth/callback?type=recovery`

      console.log("[v0] Sending password reset email to:", email)
      console.log("[v0] Redirect URL:", redirectUrl)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        console.error("[v0] Password reset error:", error)
        throw error
      }

      console.log("[v0] Password reset email sent successfully")
      setLinkSent(true)
    } catch (error: unknown) {
      console.error("[v0] Failed to send reset email:", error)
      if (error instanceof Error) {
        setError(error.message || "Failed to send reset link")
      } else {
        setError("An error occurred while sending reset link")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (linkSent) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-white p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-teal-600">TaskTrove</h1>
            <p className="text-sm text-gray-600">Campus Errand Platform</p>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                <Mail className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We&apos;ve sent a password reset link to
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the link in your email to reset your password. The link will expire in 1 hour.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={async () => {
                    setIsLoading(true)
                    setError(null)
                    try {
                      const supabase = createClient()
                      const redirectUrl = `${window.location.origin}/auth/callback?type=recovery`

                      console.log("[v0] Resending password reset email to:", email)
                      console.log("[v0] Redirect URL:", redirectUrl)

                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: redirectUrl,
                      })
                      if (error) {
                        console.error("[v0] Failed to resend reset email:", error)
                        throw error
                      }

                      console.log("[v0] Reset link resent successfully")
                      alert("Reset link resent! Check your inbox.")
                    } catch (err) {
                      setError("Failed to resend reset link. Please try again.")
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Resending..." : "Resend Password Reset Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestReset}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@university.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-teal-600 hover:underline">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
