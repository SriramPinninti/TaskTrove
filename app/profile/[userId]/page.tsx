import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Briefcase, Coins } from "lucide-react"
import { notFound } from "next/navigation"

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  await supabase.rpc("reveal_old_ratings")

  // Get profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (!profile) {
    notFound()
  }

  const averageRating = profile.average_rating || 0

  // Get total completed tasks (as helper)
  const { count: completedCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("accepted_by", userId)
    .eq("status", "completed")

  const { data: reviews } = await supabase
    .from("ratings")
    .select(`
      rating, 
      comment, 
      created_at, 
      rated_by,
      task_id,
      profiles!ratings_rated_by_fkey(full_name),
      tasks(title)
    `)
    .eq("rated_user", userId)
    .eq("is_hidden", false)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(10)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-teal-600 text-2xl text-white">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <p className="mt-1 text-sm text-gray-600">{profile.role === "admin" ? "Administrator" : "Student"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-gray-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-full bg-yellow-100 p-3">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">
                      {averageRating > 0 ? Number(averageRating).toFixed(1) : "N/A"}
                      {averageRating > 0 && <span className="text-sm text-gray-500">/5</span>}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-full bg-teal-100 p-3">
                    <Briefcase className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed Tasks</p>
                    <p className="text-2xl font-bold">{completedCount || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <Coins className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits Balance</p>
                    <p className="text-2xl font-bold">{profile.credits || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bio */}
            <div>
              <h3 className="mb-2 text-lg font-semibold">About</h3>
              {profile.bio ? (
                <p className="text-gray-700">{profile.bio}</p>
              ) : (
                <p className="italic text-gray-500">No bio added yet.</p>
              )}
            </div>

            {reviews && reviews.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">What people are saying about them</h3>
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.created_at} className="border-l-4 border-l-teal-500 bg-white">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-none text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold">{review.rating}.0</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {review.profiles?.full_name || "Anonymous"}
                            </p>
                            {review.tasks?.title && <p className="text-xs text-gray-500">Task: {review.tasks.title}</p>}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && <p className="text-sm leading-relaxed text-gray-700">"{review.comment}"</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {reviews && reviews.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <Star className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">No reviews yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
