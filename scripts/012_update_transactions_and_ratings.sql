-- Add new columns to transactions table for better tracking
alter table public.transactions
add column if not exists from_user uuid references public.profiles(id) on delete set null,
add column if not exists to_user uuid references public.profiles(id) on delete set null,
add column if not exists task_title text,
add column if not exists reward_type text;

-- Add new status types to tasks
-- Note: This updates the existing check constraint
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check 
  check (status in ('open', 'pending_approval', 'accepted', 'awaiting_confirmation', 'completed', 'expired'));

-- Add confirmation tracking columns to tasks
alter table public.tasks
add column if not exists poster_confirmed boolean default false,
add column if not exists helper_confirmed boolean default false,
add column if not exists payment_confirmed boolean default false;

-- Add hidden flag to ratings (hide until both rated or 24 hours pass)
alter table public.ratings
add column if not exists is_hidden boolean default true;

-- Create function to check if both users have rated
create or replace function check_both_rated(p_task_id uuid)
returns boolean as $$
declare
  rating_count integer;
begin
  select count(*) into rating_count
  from public.ratings
  where task_id = p_task_id;
  
  return rating_count >= 2;
end;
$$ language plpgsql security definer;

-- Create function to reveal ratings after 24 hours
create or replace function reveal_old_ratings()
returns void as $$
begin
  update public.ratings
  set is_hidden = false
  where is_hidden = true
    and created_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer;

-- Update RLS policy for ratings to respect hidden flag
drop policy if exists "ratings_select_all" on public.ratings;
create policy "ratings_select_all"
  on public.ratings for select
  using (
    not is_hidden 
    or auth.uid() = rated_by 
    or auth.uid() = rated_user
  );

-- Create index for better performance
create index if not exists transactions_from_user_idx on public.transactions(from_user);
create index if not exists transactions_to_user_idx on public.transactions(to_user);
