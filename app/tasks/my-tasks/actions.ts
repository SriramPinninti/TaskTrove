"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function approveRequest(requestId: string, taskId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from("task_requests")
      .select("*, task:tasks(*)")
      .eq("id", requestId)
      .single()

    if (requestError) throw requestError

    // Verify user is the task poster
    if (request.task.posted_by !== user.id) {
      return { error: "You are not authorized to approve this request" }
    }

    // Update request status to approved
    const { error: updateRequestError } = await supabase
      .from("task_requests")
      .update({ status: "approved" })
      .eq("id", requestId)

    if (updateRequestError) throw updateRequestError

    // Reject all other pending requests for this task
    await supabase
      .from("task_requests")
      .update({ status: "rejected" })
      .eq("task_id", taskId)
      .eq("status", "pending")
      .neq("id", requestId)

    // Update task to accepted status and set accepted_by
    const { error: updateTaskError } = await supabase
      .from("tasks")
      .update({
        status: "accepted",
        accepted_by: request.helper_id,
      })
      .eq("id", taskId)

    if (updateTaskError) throw updateTaskError

    revalidatePath("/tasks/my-tasks")
    revalidatePath(`/tasks/${taskId}`)

    return { success: true, message: "Request approved successfully!" }
  } catch (error: any) {
    console.error("[v0] Error approving request:", error)
    return { error: error.message || "Failed to approve request" }
  }
}

export async function rejectRequest(requestId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from("task_requests")
      .select("*, task:tasks(*)")
      .eq("id", requestId)
      .single()

    if (requestError) throw requestError

    // Verify user is the task poster
    if (request.task.posted_by !== user.id) {
      return { error: "You are not authorized to reject this request" }
    }

    // Update request status to rejected
    const { error: updateError } = await supabase
      .from("task_requests")
      .update({ status: "rejected" })
      .eq("id", requestId)

    if (updateError) throw updateError

    // Check if there are any other pending requests for this task
    const { data: pendingRequests } = await supabase
      .from("task_requests")
      .select("id")
      .eq("task_id", request.task_id)
      .eq("status", "pending")

    // If no more pending requests, set task back to open
    if (!pendingRequests || pendingRequests.length === 0) {
      await supabase.from("tasks").update({ status: "open" }).eq("id", request.task_id)
    }

    revalidatePath("/tasks/my-tasks")

    return { success: true, message: "Request rejected" }
  } catch (error: any) {
    console.error("[v0] Error rejecting request:", error)
    return { error: error.message || "Failed to reject request" }
  }
}

export async function repostTask(taskId: string, newDueDate: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Get the original task
    const { data: originalTask, error: fetchError } = await supabase.from("tasks").select("*").eq("id", taskId).single()

    if (fetchError) throw fetchError

    // Verify user is the task poster
    if (originalTask.posted_by !== user.id) {
      return { error: "You can only repost your own tasks" }
    }

    // Verify task is expired
    if (originalTask.status !== "expired") {
      return { error: "Only expired tasks can be reposted" }
    }

    // Validate new due date is in the future
    const newDate = new Date(newDueDate)
    const now = new Date()
    if (newDate <= now) {
      return { error: "Due date must be in the future" }
    }

    // Create a new task with the same details but new due date
    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        title: originalTask.title,
        description: originalTask.description,
        reward: originalTask.reward,
        reward_type: originalTask.reward_type,
        urgency: originalTask.urgency,
        due_date: newDueDate,
        posted_by: user.id,
        status: "open",
      })
      .select()
      .single()

    if (insertError) throw insertError

    revalidatePath("/tasks/my-tasks")
    revalidatePath("/tasks/browse")

    return { success: true, taskId: newTask.id, message: "Task reposted successfully!" }
  } catch (error: any) {
    console.error("[v0] Error reposting task:", error)
    return { error: error.message || "Failed to repost task" }
  }
}
