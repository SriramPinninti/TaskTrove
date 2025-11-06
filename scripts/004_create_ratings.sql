-- Create ratings table for task completion feedback
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  rated_by uuid not null references public.profiles(id) on delete cascade,
  rated_user uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now(),
  unique(task_id, rated_by)
);

-- Enable RLS
alter table public.ratings enable row level security;

-- RLS Policies for ratings
-- Anyone can view ratings
create policy "ratings_select_all"
  on public.ratings for select
  using (true);

-- Users can insert ratings for tasks they were involved in
create policy "ratings_insert_own"
  on public.ratings for insert
  with check (auth.uid() = rated_by);

-- Create index for better query performance
create index if not exists ratings_rated_user_idx on public.ratings(rated_user);
