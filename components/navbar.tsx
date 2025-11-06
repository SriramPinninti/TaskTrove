"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Coins, Home, ListTodo, Plus, User, LogOut, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      console.log("[v0] Checking admin status...")
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      console.log("[v0] User data:", user)
      console.log("[v0] User error:", userError)

      if (userError) {
        console.error("[v0] Error getting user:", userError)
        setIsLoading(false)
        return
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        console.log("[v0] Profile data:", profile)
        console.log("[v0] Profile error:", profileError)

        if (profileError) {
          console.error("[v0] Error getting profile:", profileError)
        }

        setIsAdmin(profile?.role === "admin")
      }
    } catch (error) {
      console.error("[v0] Error in checkAdminStatus:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error logging out:", error)
    }
  }

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/tasks/browse", label: "Browse", icon: ListTodo },
    { href: "/tasks/post", label: "Post", icon: Plus },
    { href: "/tasks/my-tasks", label: "My Tasks", icon: ListTodo },
    { href: "/wallet", label: "Wallet", icon: Coins },
    { href: "/profile", label: "Profile", icon: User },
  ]

  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield })
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-teal-600">TaskTrove</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <NotificationsDropdown />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="flex md:hidden">
            <NotificationsDropdown />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="flex-col gap-1 h-auto py-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
