import type { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Star, MessageSquare, Eye } from "lucide-react"
import Link from "next/link"

interface TaskCardProps {
  task: Task
  showActions?: boolean
}

export function TaskCard({ task, showActions = false }: TaskCardProps) {
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
    completed: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    open: "Open",
    pending_approval: "Pending Approval",
    accepted: "Accepted",
    completed: "Completed",
    expired: "Expired",
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{task.title}</CardTitle>
          <div className="flex flex-col gap-1">
            <Badge className={urgencyColors[task.urgency]}>{urgencyLabels[task.urgency]}</Badge>
            <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-gray-600">{task.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-600">
            <span className="font-semibold">
              {task.reward_type === "credits" ? `${task.reward} Credits` : `₹${task.reward}`}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        </div>
        {task.poster && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Posted by {task.poster.full_name}</span>
              {task.poster.average_rating && Number(task.poster.average_rating) > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  <span className="font-medium">{Number(task.poster.average_rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {task.accepter && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Helper: {task.accepter.full_name}</span>
              {task.accepter.average_rating && Number(task.accepter.average_rating) > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  <span className="font-medium">{Number(task.accepter.average_rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showActions && task.status === "accepted" && (
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
              <Link href={`/tasks/${task.id}`}>
                <Eye className="mr-1 h-3 w-3" />
                View Details
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
              <Link href={`/chat/${task.id}`}>
                <MessageSquare className="mr-1 h-3 w-3" />
                Open Chat
              </Link>
            </Button>
          </div>
        )}

        {!showActions && (
          <Link href={`/tasks/${task.id}`} className="block">
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              View Details
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
