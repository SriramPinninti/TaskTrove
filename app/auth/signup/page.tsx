"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Mail } from "lucide-react"

const ALLOWED_EMAIL_DOMAINS = ["@thapar.edu", "@student.thapar.edu"]

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const isValidDomain = ALLOWED_EMAIL_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain.toLowerCase()))

    if (!isValidDomain) {
      setError(`Please use your official college email address. Allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(", ")}`)
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { data: existingUser } = await supabase.from("profiles").select("email").eq("email", email).single()

      if (existingUser) {
        setError("This email is already registered. Please login with your existing account or use 'Forgot Password'.")
        setIsLoading(false)
        return
      }

      const redirectUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${typeof window !== "undefined" ? window.location.origin : ""}/auth/verify`

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectUrl}/auth/verify`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      setLinkSent(true)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          setError("Network error. Please check your connection and try again.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An error occurred during signup")
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
                Verification link sent to
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Verification link sent! Check your Thapar email inbox. Click the link to verify your email and activate
                your account.
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
                      const { error } = await supabase.auth.resend({
                        type: "signup",
                        email: email,
                        options: {
                          emailRedirectTo:
                            process.env.NEXT_PUBLIC_SITE_URL ||
                            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
                            `${typeof window !== "undefined" ? window.location.origin : ""}/auth/verify`,
                        },
                      })
                      if (error) throw error
                      alert("Verification email resent! Check your inbox.")
                    } catch (err) {
                      setError("Failed to resend email. Please try again.")
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Resending..." : "Resend Verification Email"}
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
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Create your TaskTrove account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">College Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@thapar.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Use your official college email address</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
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
