-- Create transactions table for credit history
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('earned', 'spent', 'admin_adjustment')),
  task_id uuid references public.tasks(id) on delete set null,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- RLS Policies for transactions
-- Users can view their own transactions
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

-- System can insert transactions (via service role)
create policy "transactions_insert_system"
  on public.transactions for insert
  with check (true);

-- Create index for better query performance
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at);
