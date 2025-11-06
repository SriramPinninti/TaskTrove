"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function requestTask(taskId: string) {
  console.log("[v0] Server Action: requestTask called with taskId:", taskId)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User authenticated:", user?.id)

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if task is still open
    const { data: currentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("status, posted_by")
      .eq("id", taskId)
      .single()

    console.log("[v0] Current task:", currentTask, "Error:", fetchError)

    if (fetchError) {
      console.error("[v0] Fetch error details:", JSON.stringify(fetchError))
      throw fetchError
    }

    if (currentTask.status !== "open") {
      return { error: "This task is no longer available" }
    }

    if (currentTask.posted_by === user.id) {
      return { error: "You cannot request your own task" }
    }

    // Check if user already has a pending request for this task
    const { data: existingRequest } = await supabase
      .from("task_requests")
      .select("id")
      .eq("task_id", taskId)
      .eq("helper_id", user.id)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return { error: "You already have a pending request for this task" }
    }

    // Create a task request
    console.log("[v0] Creating task request...")
    const { data: requestData, error: requestError } = await supabase
      .from("task_requests")
      .insert({
        task_id: taskId,
        helper_id: user.id,
        status: "pending",
      })
      .select()

    console.log("[v0] Request result:", requestData)
    console.log("[v0] Request error:", requestError)

    if (requestError) {
      console.error("[v0] Request error details:", JSON.stringify(requestError))
      return { error: `Database error: ${requestError.message || "Failed to create request"}` }
    }

    // Update task status to pending_approval if this is the first request
    await supabase.from("tasks").update({ status: "pending_approval" }).eq("id", taskId).eq("status", "open")

    revalidatePath(`/tasks/${taskId}`)
    revalidatePath("/tasks/browse")

    console.log("[v0] Task request created successfully")
    return { success: true, message: "Request sent! The task poster will review your request." }
  } catch (error: any) {
    console.error("[v0] Error requesting task:", error)
    console.error("[v0] Error details:", JSON.stringify(error))
    return { error: error.message || "Failed to request task" }
  }
}

export async function confirmCompletion(taskId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Get task details
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("*, poster:profiles!tasks_posted_by_fkey(*), accepter:profiles!tasks_accepted_by_fkey(*)")
      .eq("id", taskId)
      .single()

    if (fetchError) throw fetchError

    if (task.status !== "accepted" && task.status !== "awaiting_confirmation") {
      return { error: "Task must be accepted before confirmation" }
    }

    if (task.posted_by !== user.id && task.accepted_by !== user.id) {
      return { error: "You are not authorized to confirm this task" }
    }

    const isPoster = task.posted_by === user.id
    const isHelper = task.accepted_by === user.id

    // Determine which confirmation field to update
    const updateData: any = {}
    if (isPoster) {
      updateData.poster_confirmed = true
    } else if (isHelper) {
      updateData.helper_confirmed = true
    }

    // Check if this is the first confirmation
    const isFirstConfirmation = !task.poster_confirmed && !task.helper_confirmed

    if (isFirstConfirmation) {
      updateData.status = "awaiting_confirmation"
    }

    // Check if both have now confirmed
    const bothConfirmed = (isPoster && task.helper_confirmed) || (isHelper && task.poster_confirmed)

    if (bothConfirmed) {
      updateData.status = "completed"
      updateData.completed_at = new Date().toISOString()

      // Transfer credits if reward type is credits
      if (task.reward_type === "credits") {
        // Deduct from poster
        await supabase.rpc("increment", {
          row_id: task.posted_by,
          x: -task.reward,
        })

        // Add to helper
        await supabase.rpc("increment", {
          row_id: task.accepted_by,
          x: task.reward,
        })

        // Record transactions with detailed info
        await supabase.from("transactions").insert([
          {
            user_id: task.posted_by,
            amount: -task.reward,
            type: "spent",
            task_id: task.id,
            description: `Payment for task: ${task.title}`,
            from_user: task.posted_by,
            to_user: task.accepted_by,
            task_title: task.title,
            reward_type: task.reward_type,
          },
          {
            user_id: task.accepted_by,
            amount: task.reward,
            type: "earned",
            task_id: task.id,
            description: `Earned from task: ${task.title}`,
            from_user: task.posted_by,
            to_user: task.accepted_by,
            task_title: task.title,
            reward_type: task.reward_type,
          },
        ])
      }
    }

    // Update task
    const { error: updateError } = await supabase.from("tasks").update(updateData).eq("id", taskId)

    if (updateError) throw updateError

    revalidatePath(`/tasks/${taskId}`)
    revalidatePath("/tasks/my-tasks")
    revalidatePath("/wallet")

    if (bothConfirmed) {
      return {
        success: true,
        completed: true,
        message: "Task completed! Credits transferred.",
      }
    } else {
      return {
        success: true,
        completed: false,
        message: "Confirmation recorded. Waiting for the other party to confirm.",
      }
    }
  } catch (error) {
    console.error("[v0] Error confirming completion:", error)
    return { error: "Failed to confirm completion" }
  }
}

export async function markPaymentComplete(taskId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    const { data: task, error: fetchError } = await supabase.from("tasks").select("*").eq("id", taskId).single()

    if (fetchError) throw fetchError

    if (task.status !== "completed") {
      return { error: "Task must be completed first" }
    }

    if (task.reward_type !== "cash") {
      return { error: "This action is only for cash rewards" }
    }

    if (task.posted_by !== user.id && task.accepted_by !== user.id) {
      return { error: "You are not authorized" }
    }

    // Update payment confirmation
    const { error: updateError } = await supabase.from("tasks").update({ payment_confirmed: true }).eq("id", taskId)

    if (updateError) throw updateError

    revalidatePath(`/tasks/${taskId}`)
    revalidatePath("/tasks/my-tasks")

    return { success: true, message: "Payment marked as complete!" }
  } catch (error) {
    console.error("[v0] Error marking payment complete:", error)
    return { error: "Failed to mark payment complete" }
  }
}

export async function submitRating(taskId: string, ratedUserId: string, rating: number, comment: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Verify task is completed
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("status, posted_by, accepted_by")
      .eq("id", taskId)
      .single()

    if (fetchError) throw fetchError

    if (task.status !== "completed") {
      return { error: "Can only rate completed tasks" }
    }

    if (task.posted_by !== user.id && task.accepted_by !== user.id) {
      return { error: "You are not authorized to rate this task" }
    }

    // Check if user already rated
    const { data: existingRating } = await supabase
      .from("ratings")
      .select("id")
      .eq("task_id", taskId)
      .eq("rated_by", user.id)
      .single()

    if (existingRating) {
      return { error: "You have already rated this task" }
    }

    // Insert rating
    const { error: insertError } = await supabase.from("ratings").insert({
      task_id: taskId,
      rated_by: user.id,
      rated_user: ratedUserId,
      rating,
      comment: comment || null,
      is_hidden: true,
    })

    if (insertError) throw insertError

    // Check if both users have now rated
    const { data: ratings } = await supabase.from("ratings").select("id").eq("task_id", taskId)

    if (ratings && ratings.length >= 2) {
      // Reveal both ratings
      await supabase.from("ratings").update({ is_hidden: false }).eq("task_id", taskId)
    }

    revalidatePath(`/tasks/${taskId}`)
    revalidatePath(`/profile/${ratedUserId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error submitting rating:", error)
    return { error: "Failed to submit rating" }
  }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if user is the task poster
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("posted_by, status")
      .eq("id", taskId)
      .single()

    if (fetchError) throw fetchError

    if (task.posted_by !== user.id) {
      return { error: "You can only delete your own tasks" }
    }

    if (task.status === "accepted" || task.status === "completed") {
      return { error: "Cannot delete tasks that are accepted or completed" }
    }

    // Delete the task
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", taskId)

    if (deleteError) throw deleteError

    revalidatePath("/tasks/my-tasks")
    revalidatePath("/tasks/browse")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting task:", error)
    return { error: "Failed to delete task" }
  }
}
