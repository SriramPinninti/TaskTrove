"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { requestTask, confirmCompletion, markPaymentComplete, deleteTask, submitRating } from "./actions"
import { Trash2, CheckCircle, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RatingModal } from "@/components/rating-modal"

interface TaskActionsProps {
  taskId: string
  canRequest: boolean
  canConfirm: boolean
  canChat: boolean
  canDelete: boolean
  hasRequested: boolean
  taskStatus: string
  rewardType: string
  isPoster: boolean
  isHelper: boolean
  posterConfirmed: boolean
  helperConfirmed: boolean
  paymentConfirmed: boolean
  posterId: string
  helperId: string | null
  posterName: string
  helperName: string | null
  hasRated: boolean
  needsRating: boolean
}

export function TaskActions({
  taskId,
  canRequest,
  canConfirm,
  canChat,
  canDelete,
  hasRequested,
  taskStatus,
  rewardType,
  isPoster,
  isHelper,
  posterConfirmed,
  helperConfirmed,
  paymentConfirmed,
  posterId,
  helperId,
  posterName,
  helperName,
  hasRated,
  needsRating,
}: TaskActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)

  useEffect(() => {
    if (needsRating && !hasRated && taskStatus === "completed") {
      setShowRatingModal(true)
    }
  }, [needsRating, hasRated, taskStatus])

  const handleRequestTask = async () => {
    setIsRequesting(true)
    const result = await requestTask(taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsRequesting(false)
    } else {
      toast({
        title: "Success",
        description: result.message || "Request sent successfully!",
      })
      router.refresh()
      setIsRequesting(false)
    }
  }

  const handleConfirmCompletion = async () => {
    setIsConfirming(true)
    const result = await confirmCompletion(taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsConfirming(false)
    } else {
      toast({
        title: "Success",
        description: result.message || "Confirmation recorded!",
      })
      router.refresh()

      if (result.completed) {
        setTimeout(() => setShowRatingModal(true), 1000)
      }
    }
  }

  const handleMarkPaymentComplete = async () => {
    setIsMarkingPaid(true)
    const result = await markPaymentComplete(taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsMarkingPaid(false)
    } else {
      toast({
        title: "Success",
        description: result.message || "Payment marked as complete!",
      })
      router.refresh()
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    const result = await deleteTask(taskId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsDeleting(false)
    } else {
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      })
      router.push("/tasks/my-tasks")
      router.refresh()
    }
  }

  const handleSubmitRating = async (rating: number, comment: string) => {
    const ratedUserId = isPoster ? helperId! : posterId
    const result = await submitRating(taskId, ratedUserId, rating, comment)

    if (!result.error) {
      router.refresh()
    }

    return result
  }

  const ratedUserName = isPoster ? helperName : posterName
  const ratedUserId = isPoster ? helperId : posterId

  return (
    <>
      <div className="space-y-3">
        {taskStatus === "awaiting_confirmation" && (
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-800">
              {isPoster && posterConfirmed && "You confirmed completion. Waiting for helper confirmation."}
              {isHelper && helperConfirmed && "You confirmed completion. Waiting for poster confirmation."}
              {isPoster && !posterConfirmed && "Helper confirmed completion. Please confirm to finalize."}
              {isHelper && !helperConfirmed && "Poster confirmed completion. Please confirm to finalize."}
            </p>
          </div>
        )}

        {taskStatus === "completed" && rewardType === "cash" && !paymentConfirmed && (
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="mb-2 text-sm font-medium text-blue-800">
              Payment Pending - Please confirm payment through chat
            </p>
            <Button
              onClick={handleMarkPaymentComplete}
              disabled={isMarkingPaid}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              {isMarkingPaid ? "Marking..." : "Mark as Paid"}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {canRequest && !hasRequested && (
            <Button onClick={handleRequestTask} disabled={isRequesting} className="bg-teal-600 hover:bg-teal-700">
              {isRequesting ? "Sending Request..." : "Request to Help"}
            </Button>
          )}

          {hasRequested && (
            <div className="rounded-md bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
              Request pending - waiting for poster approval
            </div>
          )}

          {canConfirm && (
            <Button
              onClick={handleConfirmCompletion}
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isConfirming ? "Confirming..." : "Confirm Completion"}
            </Button>
          )}

          {canChat && (
            <Button asChild variant="outline">
              <Link href={`/chat/${taskId}`}>Open Chat</Link>
            </Button>
          )}

          {canDelete && (
            <Button onClick={handleDeleteTask} disabled={isDeleting} variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Task"}
            </Button>
          )}

          {taskStatus === "completed" && !hasRated && (
            <Button
              onClick={() => setShowRatingModal(true)}
              variant="outline"
              className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
            >
              Rate {ratedUserName}
            </Button>
          )}
        </div>
      </div>

      {ratedUserId && ratedUserName && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          taskId={taskId}
          ratedUserId={ratedUserId}
          ratedUserName={ratedUserName}
          onSubmit={handleSubmitRating}
        />
      )}
    </>
  )
}
