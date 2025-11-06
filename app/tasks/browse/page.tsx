import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { TaskCard } from "@/components/task-card"
import { expireOldTasks } from "@/lib/expire-tasks"
import type { Task } from "@/lib/types"

export default async function BrowseTasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  await expireOldTasks()

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, poster:profiles!tasks_posted_by_fkey(*)")
    .eq("status", "open")
    .neq("posted_by", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Tasks</h1>
          <p className="text-gray-600">Find tasks you can help with and earn credits</p>
        </div>

        {tasks && tasks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task as Task} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No tasks available at the moment. Check back later!</p>
          </div>
        )}
      </main>
    </div>
  )
}
