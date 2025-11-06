"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Notification } from "@/lib/types"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/notifications/actions"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadNotifications()

    // Subscribe to real-time notifications
    const supabase = createClient()
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    setIsLoading(true)
    const result = await getNotifications()
    if (result.notifications) {
      setNotifications(result.notifications)
      setUnreadCount(result.notifications.filter((n) => !n.is_read).length)
    }
    setIsLoading(false)
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markNotificationAsRead(notification.id)

    // Navigate to related page
    if (notification.related_task_id) {
      router.push(`/tasks/${notification.related_task_id}`)
    }

    setIsOpen(false)
    loadNotifications()
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    loadNotifications()
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task_request":
        return "📋"
      case "request_approved":
        return "✅"
      case "request_rejected":
        return "❌"
      case "task_completed":
        return "🎉"
      case "new_message":
        return "💬"
      case "rating_received":
        return "⭐"
      default:
        return "🔔"
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-2">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs">
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-3"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full gap-3">
                  <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.is_read ? "font-semibold" : ""}`}>{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
