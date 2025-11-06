"use server"

import { createClient } from "@/lib/supabase/server"

export async function revealOldRatings() {
  const supabase = await createClient()

  try {
    const { error } = await supabase.rpc("reveal_old_ratings")

    if (error) {
      console.error("[v0] Error revealing old ratings:", error)
    }
  } catch (error) {
    console.error("[v0] Failed to call reveal_old_ratings:", error)
  }
}
