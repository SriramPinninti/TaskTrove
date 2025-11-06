-- Create task_requests table for helper request system
create table if not exists public.task_requests (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  helper_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies for task_requests
alter table public.task_requests enable row level security;

-- Helpers can view their own requests
create policy "task_requests_select_own"
  on public.task_requests for select
  using (auth.uid() = helper_id);

-- Task posters can view requests for their tasks
create policy "task_requests_select_poster"
  on public.task_requests for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_requests.task_id
      and tasks.posted_by = auth.uid()
    )
  );

-- Helpers can create requests for tasks they don't own
create policy "task_requests_insert"
  on public.task_requests for insert
  with check (
    auth.uid() = helper_id
    and exists (
      select 1 from public.tasks
      where tasks.id = task_requests.task_id
      and tasks.posted_by != auth.uid()
      and tasks.status = 'open'
    )
  );

-- Task posters can update request status (approve/reject)
create policy "task_requests_update_poster"
  on public.task_requests for update
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_requests.task_id
      and tasks.posted_by = auth.uid()
    )
  );

-- Create index for faster queries
create index if not exists task_requests_task_id_idx on public.task_requests(task_id);
create index if not exists task_requests_helper_id_idx on public.task_requests(helper_id);
create index if not exists task_requests_status_idx on public.task_requests(status);

-- Add trigger to update updated_at timestamp
create or replace function public.update_task_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_task_requests_updated_at
  before update on public.task_requests
  for each row
  execute function public.update_task_requests_updated_at();
