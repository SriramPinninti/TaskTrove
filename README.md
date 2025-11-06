# TaskTrove campus platform

**TaskTrove** is a campus-based peer-to-peer errand management web app that helps students post, accept, and complete everyday tasks in exchange for credits.  
It is designed to promote collaboration, convenience, and time-saving on campus.

project is live at:
 **Live Site:** [https://axodojo.xyz](https://axodojo.xyz)  
 **Repository:** https://github.com/SriramPinninti/TaskTrove

## Features

### User Authentication
- Secure **Supabase Auth** (email link verification & password reset).  
- Only verified **Thapar University** emails (`@thapar.edu`) can register.  
- Real-time session handling and logout via Supabase.  

### Task Management
- Users can **post**, **browse**, and **accept** campus errands.  
- Posters can specify:
  - Task title and description  
  - Reward amount (credits or cash)  
  - Urgency level and due time  
- Helpers can view all open tasks and request to accept them.

### Chat System
- Direct chat between task poster and helper after acceptance.  
- Ensures coordination for completing errands and sharing proof.

### Credits & Wallet System
- Each user starts with default credits on registration.  
- Credits auto-transfer after task completion approval.  
- Wallet tracks **earnings**, **spends**, and **total balance**.

###  Ratings & Reviews
- After task completion, both poster and helper can rate each other.  
- Reviews are visible in profiles under “What people say about them.”

###Smart Automation
- Tasks auto-expire after their due date.  
- Poster can repost expired tasks with a single click.

### Notifications (Planned)
- Email notifications for new requests, task approvals, and reminders.

---

## Tech Stack

| Category | Technology Used |
|-----------|----------------|
| **Frontend** | [Next.js 14](https://nextjs.org/) via [v0.dev](https://v0.dev) |
| **Backend / Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime) |
| **Hosting / Deployment** | [Vercel](https://vercel.com/) |
| **Database** | Supabase PostgreSQL |
| **State Management** | React hooks, Supabase client |
| **Styling** | Tailwind CSS + Shadcn/UI components |
| **Icons & UI** | Lucide Icons, Framer Motion animations |
| **Domain** | Custom: [https://axodojo.xyz](https://axodojo.xyz) |
| **Version Control** | Git + GitHub |

---
