-- Create messages table for chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- RLS Policies for messages
-- Users can only see messages where they are sender or receiver
create policy "messages_select_own"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can insert messages where they are the sender
create policy "messages_insert_own"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Create index for better query performance
create index if not exists messages_task_id_idx on public.messages(task_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
