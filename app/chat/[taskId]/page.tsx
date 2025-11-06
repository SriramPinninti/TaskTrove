"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Task, Message, Profile } from "@/lib/types"
import { Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChatData()
    const interval = setInterval(loadMessages, 3000) // Poll for new messages every 3 seconds
    return () => clearInterval(interval)
  }, [params.taskId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      setCurrentUser(profile)

      const { data: taskData } = await supabase
        .from("tasks")
        .select("*, poster:profiles!tasks_posted_by_fkey(*), accepter:profiles!tasks_accepted_by_fkey(*)")
        .eq("id", params.taskId)
        .single()

      if (!taskData) {
        router.push("/dashboard")
        return
      }

      // Check if user is part of this task
      if (taskData.posted_by !== user.id && taskData.accepted_by !== user.id) {
        router.push("/dashboard")
        return
      }

      setTask(taskData as Task)
      await loadMessages()
    } catch (error) {
      console.error("[v0] Error loading chat data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    const supabase = createClient()

    try {
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(*)")
        .eq("task_id", params.taskId)
        .order("created_at", { ascending: true })

      if (messagesData) {
        setMessages(messagesData as Message[])
      }
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !task || !currentUser) return

    const supabase = createClient()
    setIsSending(true)

    try {
      const receiverId = currentUser.id === task.posted_by ? task.accepted_by : task.posted_by

      const { error } = await supabase.from("messages").insert({
        task_id: task.id,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")
      await loadMessages()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p>Loading chat...</p>
        </main>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p>Chat not found</p>
        </main>
      </div>
    )
  }

  const otherUser = currentUser?.id === task.posted_by ? task.accepter : task.poster

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href={`/tasks/${task.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Task
            </Button>
          </Link>
        </div>

        <Card className="flex h-[600px] flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Chat with {otherUser?.full_name}</CardTitle>
            <p className="text-sm text-gray-600">{task.title}</p>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length > 0 ? (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUser?.id
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwnMessage ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <p className={`mt-1 text-xs ${isOwnMessage ? "text-teal-100" : "text-gray-500"}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t bg-white p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
