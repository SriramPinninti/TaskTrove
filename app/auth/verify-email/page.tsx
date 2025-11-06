"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResending(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: "Verification email sent! Please check your inbox.",
      })
      setEmail("")
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({
          type: "error",
          text: error.message,
        })
      } else {
        setMessage({
          type: "error",
          text: "Failed to resend verification email",
        })
      }
    } finally {
      setIsResending(false)
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
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>We&apos;ve sent you a verification link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Please check your email and click the verification link to activate your account. Once verified, you can
              login and start using TaskTrove.
            </p>

            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Didn&apos;t receive the email?</p>
              <form onSubmit={handleResendVerification} className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm">
                    Enter your email to resend
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@university.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {message && (
                  <div
                    className={`rounded-md p-3 text-sm ${
                      message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-teal-600 text-teal-600 hover:bg-teal-50 bg-transparent"
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
              </form>
            </div>

            <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
