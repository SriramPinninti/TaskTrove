import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Coins, ListTodo, Plus, TrendingUp, Wallet, MessageSquare } from "lucide-react"
import { expireOldTasks } from "@/lib/expire-tasks"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  await expireOldTasks()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: myPostedTasks, count: postedCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("posted_by", user.id)

  const { data: myAcceptedTasks, count: acceptedCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("accepted_by", user.id)

  const { data: recentTasks } = await supabase
    .from("tasks")
    .select("*, poster:profiles!tasks_posted_by_fkey(*)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(3)

  const statusColors = {
    open: "bg-green-100 text-green-800",
    pending_approval: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    open: "Open",
    pending_approval: "Pending Approval",
    accepted: "Accepted",
    completed: "Completed",
    expired: "Expired",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name}!</h1>
          <p className="text-gray-600">Ready to help or get help with campus errands?</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Credits</CardTitle>
              <Coins className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{profile?.credits || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tasks Posted</CardTitle>
              <Plus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{postedCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tasks Accepted</CardTitle>
              <ListTodo className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acceptedCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(postedCount || 0) + (acceptedCount || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button asChild className="h-auto flex-col gap-2 bg-teal-600 py-4 hover:bg-teal-700">
                  <Link href="/tasks/post">
                    <Plus className="h-6 w-6" />
                    <span>Post Task</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <Link href="/tasks/browse">
                    <ListTodo className="h-6 w-6" />
                    <span>Browse Tasks</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <Link href="/wallet">
                    <Wallet className="h-6 w-6" />
                    <span>Wallet</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <Link href="/tasks/my-tasks">
                    <MessageSquare className="h-6 w-6" />
                    <span>My Tasks</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Open Tasks</CardTitle>
                <Link href="/tasks/browse" className="text-sm text-teal-600 hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTasks && recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block rounded-lg border p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-600">
                            {task.reward_type === "credits" ? `${task.reward} Credits` : `₹${task.reward}`}
                          </p>
                        </div>
                        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent tasks available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Active Tasks</CardTitle>
                <Link href="/tasks/my-tasks" className="text-sm text-teal-600 hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {myAcceptedTasks && myAcceptedTasks.length > 0 ? (
                <div className="space-y-3">
                  {myAcceptedTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-600">
                            {task.reward_type === "credits" ? `${task.reward} Credits` : `₹${task.reward}`}
                          </p>
                        </div>
                        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Link href={`/tasks/${task.id}`}>View Details</Link>
                        </Button>
                        {task.status === "accepted" && (
                          <Button asChild size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
                            <Link href={`/chat/${task.id}`}>
                              <MessageSquare className="mr-1 h-3 w-3" />
                              Chat
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active tasks yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
