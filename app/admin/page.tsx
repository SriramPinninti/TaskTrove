"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Profile, Task } from "@/lib/types"
import { Trash2, Users, ListTodo, Shield } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<Profile[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [showAdjustCreditsDialog, setShowAdjustCreditsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [creditAdjustment, setCreditAdjustment] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      await loadData()
    } catch (error) {
      console.error("[v0] Error checking admin access:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    const supabase = createClient()

    try {
      const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, poster:profiles!tasks_posted_by_fkey(*)")
        .order("created_at", { ascending: false })

      if (usersData) setUsers(usersData)
      if (tasksData) setTasks(tasksData as Task[])
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    }
  }

  const handleDeleteAllTasks = async () => {
    const supabase = createClient()
    setIsDeleting(true)

    try {
      const { error } = await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      if (error) throw error

      await loadData()
      setShowDeleteAllDialog(false)
    } catch (error) {
      console.error("[v0] Error deleting tasks:", error)
      alert("Failed to delete tasks")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAdjustCredits = async () => {
    if (!selectedUser || !creditAdjustment) return

    const supabase = createClient()
    setIsAdjusting(true)

    try {
      const adjustment = Number.parseInt(creditAdjustment)
      if (isNaN(adjustment)) {
        throw new Error("Invalid credit amount")
      }

      // Update user credits
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: selectedUser.credits + adjustment })
        .eq("id", selectedUser.id)

      if (updateError) throw updateError

      // Record transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: selectedUser.id,
        amount: adjustment,
        type: "admin_adjustment",
        description: adjustmentReason || "Admin credit adjustment",
      })

      if (transactionError) throw transactionError

      await loadData()
      setShowAdjustCreditsDialog(false)
      setSelectedUser(null)
      setCreditAdjustment("")
      setAdjustmentReason("")
    } catch (error) {
      console.error("[v0] Error adjusting credits:", error)
      alert("Failed to adjust credits")
    } finally {
      setIsAdjusting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p>Loading...</p>
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-teal-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage users and tasks</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "open").length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.credits}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowAdjustCreditsDialog(true)
                            }}
                          >
                            Adjust Credits
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllDialog(true)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All Tasks
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Posted By</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.poster?.full_name}</TableCell>
                        <TableCell>
                          {task.reward} {task.reward_type}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              task.status === "open"
                                ? "bg-green-100 text-green-800"
                                : task.status === "accepted"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Tasks</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all tasks? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllTasks} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdjustCreditsDialog} onOpenChange={setShowAdjustCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>Adjust credits for {selectedUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current">Current Balance</Label>
              <Input id="current" value={selectedUser?.credits || 0} disabled />
            </div>
            <div>
              <Label htmlFor="adjustment">Adjustment (use negative for deduction)</Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="e.g., 100 or -50"
                value={creditAdjustment}
                onChange={(e) => setCreditAdjustment(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="e.g., Bonus credits"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustCreditsDialog(false)
                setSelectedUser(null)
                setCreditAdjustment("")
                setAdjustmentReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustCredits}
              disabled={isAdjusting || !creditAdjustment}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isAdjusting ? "Adjusting..." : "Adjust Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
