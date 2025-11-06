"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"
import { repostTask } from "./actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface RepostDialogProps {
  taskId: string
  taskTitle: string
}

export function RepostDialog({ taskId, taskTitle }: RepostDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dueDate, setDueDate] = useState("")

  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  }

  const handleRepost = async () => {
    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const result = await repostTask(taskId, dueDate)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsLoading(false)
    } else {
      toast({
        title: "Success",
        description: result.message || "Task reposted!",
      })
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Repost
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repost Task</DialogTitle>
          <DialogDescription>
            Create a new task with the same details. Set a new due date for: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="due_date">New Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              min={getMinDateTime()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRepost} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
            {isLoading ? "Reposting..." : "Repost Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
