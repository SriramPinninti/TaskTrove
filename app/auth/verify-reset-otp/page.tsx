"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2 } from "lucide-react"

export default function VerifyResetOTPPage() {
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("reset_email")
      if (storedEmail) {
        setEmail(storedEmail)
      } else {
        router.push("/auth/forgot-password")
      }
    }
  }, [router])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "magiclink",
      })

      if (error) throw error

      if (data.session) {
        setSuccess("Code verified! Redirecting to set new password...")
        if (typeof window !== "undefined") {
          sessionStorage.setItem("reset_session", JSON.stringify(data.session))
          sessionStorage.removeItem("reset_email")
        }
        setTimeout(() => {
          router.push("/auth/reset-password-new")
        }, 1500)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Invalid code. Please try again.")
      } else {
        setError("An error occurred during verification")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) throw error

      setSuccess("Reset code sent to your email!")
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Failed to resend code")
      } else {
        setError("An error occurred while resending code")
      }
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-white p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-teal-600">TaskTrove</h1>
          <p className="text-sm text-gray-600">Campus Errand Platform</p>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <Mail className="h-6 w-6 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">Verify Reset Code</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="otp">Reset Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>}
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-teal-600"
                  onClick={handleResendOTP}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
