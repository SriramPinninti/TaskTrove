"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      console.log("[v0] Reset password - Checking authentication")
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        console.log("[v0] Reset password - User authenticated:", user.id)
        setIsAuthenticated(true)
      } else {
        console.error("[v0] Reset password - No authenticated user, redirecting to forgot password")
        // Redirect to forgot password if not authenticated
        router.push("/auth/forgot-password?error=link_expired")
      }
    }

    checkAuth()
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      console.log("[v0] Reset password - Updating password")
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) {
        console.error("[v0] Reset password - Update failed:", error.message)
        throw error
      }

      console.log("[v0] Reset password - Password updated successfully")
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login?password_reset=true")
      }, 2000)
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred while resetting password")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated && !success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-white p-6">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">Please wait while we verify your reset link.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-white p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-teal-600">TaskTrove</h1>
            <p className="text-sm text-gray-600">Campus Errand Platform</p>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
              <CardDescription>Your password has been updated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                You can now login with your new password. Redirecting to login page...
              </p>
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
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
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
