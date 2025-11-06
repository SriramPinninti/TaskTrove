"use server"

import { createClient } from "@/lib/supabase/server"

export async function expireOldTasks() {
  const supabase = await createClient()

  try {
    // Call the database function to expire old tasks
    const { error } = await supabase.rpc("expire_old_tasks")

    if (error) {
      console.error("[v0] Error expiring tasks:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in expireOldTasks:", error)
    return { error: error.message }
  }
}
