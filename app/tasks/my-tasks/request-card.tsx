"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Clock, Eye, MessageCircle } from "lucide-react"
import { approveRequest, rejectRequest } from "./actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { TaskRequest } from "@/lib/types"
import Link from "next/link"

interface RequestCardProps {
  request: TaskRequest
  taskTitle: string
}

export function RequestCard({ request, taskTitle }: RequestCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    const result = await approveRequest(request.id, request.task_id)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsApproving(false)
    } else {
      toast({
        title: "Success",
        description: result.message || "Request approved!",
      })
      router.refresh()
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    const result = await rejectRequest(request.id)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsRejecting(false)
    } else {
      toast({
        title: "Success",
        description: result.message || "Request rejected",
      })
      router.refresh()
    }
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
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">For task: {taskTitle}</p>
            <div className="mt-2 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{request.helper?.full_name}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Requested {formatDate(request.created_at)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/profile/${request.helper_id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                <Eye className="h-4 w-4" />
                View Profile
              </Button>
            </Link>
            <Link href={`/chat/request/${request.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </Link>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {isApproving ? "Approving..." : "Approve"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              variant="outline"
              className="flex-1 bg-transparent"
              size="sm"
            >
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
