"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyTempPasswordPage() {
  const [email, setEmail] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerifyTempPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/verify-temp-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tempPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid temporary password")
      }

      // Store reset token in sessionStorage for next step
      sessionStorage.setItem("resetToken", data.resetToken)
      sessionStorage.setItem("resetEmail", email)

      router.push("/auth/reset-password-new")
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred")
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
            <CardTitle className="text-2xl">Verify Temporary Password</CardTitle>
            <CardDescription>Enter your email and the temporary password we sent</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyTempPassword}>
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
                <div className="grid gap-2">
                  <Label htmlFor="tempPassword">Temporary Password</Label>
                  <Input
                    id="tempPassword"
                    type="text"
                    placeholder="Enter 8-character temporary password"
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                  />
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Password"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                <Link href="/auth/forgot-password" className="text-teal-600 hover:underline">
                  Didn&apos;t receive password? Try again
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
