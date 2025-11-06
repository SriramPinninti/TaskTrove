-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  reward numeric not null check (reward > 0),
  reward_type text not null check (reward_type in ('credits', 'cash')),
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent', 'very_urgent')),
  status text not null default 'open' check (status in ('open', 'accepted', 'completed', 'cancelled')),
  posted_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  due_date timestamp with time zone not null,
  completed_at timestamp with time zone
);

-- Enable RLS
alter table public.tasks enable row level security;

-- RLS Policies for tasks
-- Anyone can view open tasks
create policy "tasks_select_open"
  on public.tasks for select
  using (status = 'open' or posted_by = auth.uid() or accepted_by = auth.uid());

-- Users can insert their own tasks
create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = posted_by);

-- Users can update their own posted tasks or accepted tasks
create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = posted_by or auth.uid() = accepted_by);

-- Users can delete their own posted tasks (only if not accepted)
create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = posted_by and status = 'open');

-- Admin can delete any task
create policy "tasks_admin_delete"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create index for better query performance
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_posted_by_idx on public.tasks(posted_by);
create index if not exists tasks_accepted_by_idx on public.tasks(accepted_by);
