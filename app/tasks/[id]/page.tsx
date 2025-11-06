import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, AlertCircle, Star } from "lucide-react"
import { TaskActions } from "./task-actions"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { revealOldRatings } from "@/lib/reveal-ratings"

const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const taskId = resolvedParams.id

  await revealOldRatings()

  if (!isValidUUID(taskId)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-900">Invalid Task ID</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-800">The task ID provided is not valid. Please check the URL and try again.</p>
              <Link href="/tasks/browse">
                <Button className="bg-teal-600 hover:bg-teal-700">Go Back to Browse Tasks</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, poster:profiles!tasks_posted_by_fkey(*), accepter:profiles!tasks_accepted_by_fkey(*)")
    .eq("id", taskId)
    .maybeSingle()

  if (taskError || !task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-orange-900">Task Not Found</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-orange-800">The task you're looking for doesn't exist or may have been deleted.</p>
              <div className="flex gap-3">
                <Link href="/tasks/browse">
                  <Button className="bg-teal-600 hover:bg-teal-700">Browse Tasks</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { data: existingRequest } = await supabase
    .from("task_requests")
    .select("id, status")
    .eq("task_id", taskId)
    .eq("helper_id", user.id)
    .eq("status", "pending")
    .maybeSingle()

  const hasRequested = !!existingRequest

  const { data: userRating } = await supabase
    .from("ratings")
    .select("id")
    .eq("task_id", taskId)
    .eq("rated_by", user.id)
    .maybeSingle()

  const hasRated = !!userRating

  const urgencyColors = {
    normal: "bg-blue-100 text-blue-800",
    urgent: "bg-orange-100 text-orange-800",
    very_urgent: "bg-red-100 text-red-800",
  }

  const urgencyLabels = {
    normal: "Normal",
    urgent: "Urgent",
    very_urgent: "Very Urgent",
  }

  const statusColors = {
    open: "bg-green-100 text-green-800",
    pending_approval: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    awaiting_confirmation: "bg-purple-100 text-purple-800",
    completed: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    open: "Open",
    pending_approval: "Pending Approval",
    accepted: "Accepted",
    awaiting_confirmation: "Awaiting Confirmation",
    completed: "Completed",
    expired: "Expired",
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isTaskPoster = profile?.id === task.posted_by
  const isTaskAccepter = profile?.id === task.accepted_by
  const canRequest = (task.status === "open" || task.status === "pending_approval") && !isTaskPoster
  const canConfirm =
    (task.status === "accepted" || task.status === "awaiting_confirmation") && (isTaskPoster || isTaskAccepter)
  const canChat =
    (task.status === "accepted" || task.status === "awaiting_confirmation" || task.status === "completed") &&
    (isTaskPoster || isTaskAccepter)
  const canDelete = isTaskPoster && (task.status === "open" || task.status === "pending_approval")
  const needsRating = task.status === "completed" && (isTaskPoster || isTaskAccepter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className={urgencyColors[task.urgency]}>{urgencyLabels[task.urgency]}</Badge>
                  <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                    {statusLabels[task.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-teal-600">
                <span className="text-2xl font-bold">
                  {task.reward_type === "credits" ? `${task.reward} Credits` : `₹${task.reward}`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-gray-700">{task.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Due Date</h3>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(task.due_date)}</span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Posted By</h3>
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{task.poster?.full_name}</span>
                  {task.poster?.average_rating && Number(task.poster.average_rating) > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4 fill-yellow-400" />
                      <span className="text-sm font-medium">{Number(task.poster.average_rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {task.accepter && (
                <div>
                  <h3 className="mb-2 font-semibold">Accepted By</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span>{task.accepter.full_name}</span>
                    {task.accepter.average_rating && Number(task.accepter.average_rating) > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-yellow-400" />
                        <span className="text-sm font-medium">{Number(task.accepter.average_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <TaskActions
              taskId={task.id}
              canRequest={canRequest}
              canConfirm={canConfirm}
              canChat={canChat}
              canDelete={canDelete}
              hasRequested={hasRequested}
              taskStatus={task.status}
              rewardType={task.reward_type}
              isPoster={isTaskPoster}
              isHelper={isTaskAccepter}
              posterConfirmed={task.poster_confirmed || false}
              helperConfirmed={task.helper_confirmed || false}
              paymentConfirmed={task.payment_confirmed || false}
              posterId={task.posted_by}
              helperId={task.accepted_by}
              posterName={task.poster?.full_name || ""}
              helperName={task.accepter?.full_name || null}
              hasRated={hasRated}
              needsRating={needsRating}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
