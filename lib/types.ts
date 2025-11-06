export interface Profile {
  id: string
  full_name: string
  email: string
  credits: number
  role: "user" | "admin"
  created_at: string
  bio?: string
}

export interface Task {
  id: string
  title: string
  description: string
  reward: number
  reward_type: "credits" | "cash"
  urgency: "normal" | "urgent" | "very_urgent"
  status: "open" | "pending_approval" | "accepted" | "awaiting_confirmation" | "completed" | "expired"
  posted_by: string
  accepted_by: string | null
  created_at: string
  due_date: string
  completed_at: string | null
  poster_confirmed?: boolean
  helper_confirmed?: boolean
  payment_confirmed?: boolean
  poster?: Profile
  accepter?: Profile
}

export interface Message {
  id: string
  task_id: string | null
  request_id?: string | null
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender?: Profile
}

export interface Rating {
  id: string
  task_id: string
  rated_by: string
  rated_user: string
  rating: number
  comment: string | null
  created_at: string
  is_hidden?: boolean
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: "earned" | "spent" | "admin_adjustment"
  task_id: string | null
  description: string | null
  created_at: string
  from_user?: string | null
  to_user?: string | null
  task_title?: string | null
  reward_type?: string | null
}

export interface TaskRequest {
  id: string
  task_id: string
  helper_id: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
  helper?: Profile
  task?: Task
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type:
    | "task_request"
    | "request_approved"
    | "request_rejected"
    | "task_completed"
    | "new_task"
    | "new_message"
    | "rating_received"
  related_task_id: string | null
  related_user_id: string | null
  is_read: boolean
  created_at: string
}
