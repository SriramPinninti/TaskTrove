"use client"

import type React from "react"

import { useState } from "react"
import { postTask } from "./actions"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PostTaskPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
    reward_type: "credits",
    urgency: "normal",
    due_date: "",
  })

  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const selectedDate = new Date(formData.due_date)
    const now = new Date()
    if (selectedDate <= now) {
      setError("Deadline must be in the future")
      setIsLoading(false)
      return
    }

    try {
      const formDataObj = new FormData(e.currentTarget)
      const result = await postTask(formDataObj)

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // If successful, the server action will redirect
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred while posting the task")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Task</h1>
          <p className="text-gray-600">Describe what you need help with and set a reward</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Pick up package from mail room"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide more details about the task..."
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reward">
                    Reward Amount {formData.reward_type === "credits" ? "(Credits)" : "(₹)"}
                  </Label>
                  <Input
                    id="reward"
                    name="reward"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="50"
                    required
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward_type">Reward Type</Label>
                  <Select
                    name="reward_type"
                    value={formData.reward_type}
                    onValueChange={(value) => setFormData({ ...formData, reward_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credits">Credits</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="reward_type" value={formData.reward_type} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select
                    name="urgency"
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="very_urgent">Very Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="urgency" value={formData.urgency} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="datetime-local"
                    required
                    min={getMinDateTime()}
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? "Posting..." : "Post Task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
