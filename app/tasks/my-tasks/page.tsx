import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { TaskCard } from "@/components/task-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequestCard } from "./request-card"
import { RepostDialog } from "./repost-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { expireOldTasks } from "@/lib/expire-tasks"
import type { Task, TaskRequest } from "@/lib/types"
import Link from "next/link"

export default async function MyTasksPage() {
  console.log("[v0] Loading My Tasks page...")

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log("[v0] User:", user?.id)
  console.log("[v0] User error:", userError)

  if (!user) {
    redirect("/auth/login")
  }

  await expireOldTasks()

  const { data: postedTasks, error: postedError } = await supabase
    .from("tasks")
    .select("*, accepter:profiles!tasks_accepted_by_fkey(*)")
    .eq("posted_by", user.id)
    .order("created_at", { ascending: false })

  console.log("[v0] Posted tasks:", postedTasks)
  console.log("[v0] Posted tasks error:", postedError)

  const { data: acceptedTasks, error: acceptedError } = await supabase
    .from("tasks")
    .select("*, poster:profiles!tasks_posted_by_fkey(*)")
    .eq("accepted_by", user.id)
    .order("created_at", { ascending: false })

  console.log("[v0] Accepted tasks:", acceptedTasks)
  console.log("[v0] Accepted tasks error:", acceptedError)

  const { data: pendingRequests } = await supabase
    .from("task_requests")
    .select("*, helper:profiles!task_requests_helper_id_fkey(*), task:tasks!task_requests_task_id_fkey(*)")
    .eq("status", "pending")
    .in("task_id", postedTasks?.map((t) => t.id) || [])
    .order("created_at", { ascending: false })

  console.log("[v0] Pending requests:", pendingRequests)

  const activeTasks = postedTasks?.filter((t) => t.status !== "expired") || []
  const expiredTasks = postedTasks?.filter((t) => t.status === "expired") || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Manage tasks you&apos;ve posted and accepted</p>
        </div>

        {pendingRequests && pendingRequests.length > 0 && (
          <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-yellow-900">Pending Requests ({pendingRequests.length})</h2>
            <p className="mb-4 text-sm text-yellow-800">Review and approve helpers who want to work on your tasks</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request as TaskRequest}
                  taskTitle={request.task?.title || "Unknown Task"}
                />
              ))}
            </div>
          </div>
        )}

        {expiredTasks.length > 0 && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-red-900">Expired Tasks ({expiredTasks.length})</h2>
            <p className="mb-4 text-sm text-red-800">
              These tasks have passed their due date. You can repost them with a new deadline.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expiredTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Link href={`/tasks/${task.id}`} className="font-semibold hover:text-teal-600">
                          {task.title}
                        </Link>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800">Expired</Badge>
                          <span className="text-sm text-gray-600">
                            {task.reward_type === "credits" ? `${task.reward} Credits` : `₹${task.reward}`}
                          </span>
                        </div>
                      </div>
                      <RepostDialog taskId={task.id} taskTitle={task.title} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="posted" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="posted">Posted by Me</TabsTrigger>
            <TabsTrigger value="accepted">Accepted by Me</TabsTrigger>
          </TabsList>

          <TabsContent value="posted" className="mt-6">
            {activeTasks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeTasks.map((task) => (
                  <TaskCard key={task.id} task={task as Task} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500">You haven&apos;t posted any active tasks yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="mt-6">
            {acceptedTasks && acceptedTasks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {acceptedTasks.map((task) => (
                  <TaskCard key={task.id} task={task as Task} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500">You haven&apos;t accepted any tasks yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
