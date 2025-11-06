-- Drop the old update policy
drop policy if exists "tasks_update_own" on public.tasks;

-- Create separate policies for different update scenarios

-- Policy 1: Task poster can update their own tasks
create policy "tasks_update_by_poster"
  on public.tasks for update
  using (auth.uid() = posted_by);

-- Policy 2: Task accepter can update accepted tasks (for marking complete)
create policy "tasks_update_by_accepter"
  on public.tasks for update
  using (auth.uid() = accepted_by);

-- Policy 3: ANY authenticated user can accept an open task (set accepted_by)
create policy "tasks_accept_open"
  on public.tasks for update
  using (
    status = 'open' 
    and auth.uid() is not null 
    and auth.uid() != posted_by
  )
  with check (
    status = 'accepted' 
    and accepted_by = auth.uid()
  );
