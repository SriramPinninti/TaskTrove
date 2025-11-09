"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function postTask(formData: FormData) {
  const supabase = await createClient()

  console.log("[v0] postTask called with form data")

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log("[v0] User error:", userError)
    return { error: "You must be logged in to post a task" }
  }

  console.log("[v0] User authenticated:", user.id)

  // Extract form data
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const reward = formData.get("reward") as string
  const reward_type = formData.get("reward_type") as string
  const urgency = formData.get("urgency") as string
  const due_date = formData.get("due_date") as string

  // Validate inputs
  if (!title || !description || !reward || !reward_type || !due_date) {
    return { error: "All fields are required" }
  }

  // Validate reward
  if (Number(reward) <= 0) {
    return { error: "Reward must be greater than 0" }
  }

  const selectedDate = new Date(due_date)
  const now = new Date()
  if (selectedDate <= now) {
    return { error: "Deadline must be in the future" }
  }

  // Check for duplicate posting (same title within 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: recentTasks, error: checkError } = await supabase
    .from("tasks")
    .select("id")
    .eq("posted_by", user.id)
    .eq("title", title)
    .gte("created_at", fiveMinutesAgo)

  if (checkError) {
    console.error("[v0] Warning - could not check for recent tasks:", {
      message: checkError.message,
      code: checkError.code,
    })
    // Continue anyway - duplicate check is not critical
  }

  if (recentTasks && recentTasks.length > 0) {
    return { error: "You recently posted a task with the same title. Please wait a few minutes." }
  }

  const taskData = {
    title,
    description,
    reward: Number(reward),
    reward_type,
    urgency,
    due_date: selectedDate.toISOString(),
    posted_by: user.id,
    status: "open",
  }

  console.log("[v0] Inserting task with data:", taskData)

  // Insert the task
  const { error: insertError, data: insertedTask } = await supabase.from("tasks").insert(taskData).select()

  if (insertError) {
    console.error("[v0] Error inserting task:", {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
    })
    return { error: `Failed to post task: ${insertError.message}` }
  }

  console.log("[v0] Task inserted successfully:", insertedTask)

  revalidatePath("/tasks/my-tasks")
  revalidatePath("/tasks/browse")
  revalidatePath("/dashboard")
  redirect("/tasks/my-tasks")
}
