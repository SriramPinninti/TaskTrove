-- Update tasks table to support new status types
-- Current statuses: open, accepted, completed
-- New statuses: open, pending_approval, accepted, completed, expired

-- First, check if we need to update the constraint
do $$
begin
  -- Drop the old constraint if it exists
  alter table public.tasks drop constraint if exists tasks_status_check;
  
  -- Add new constraint with all status types
  alter table public.tasks add constraint tasks_status_check 
    check (status in ('open', 'pending_approval', 'accepted', 'completed', 'expired', 'awaiting_confirmation'));
exception
  when others then
    -- If constraint already exists with correct values, ignore
    null;
end $$;

-- Fixed column name from 'deadline' to 'due_date' to match actual schema
-- Create function to check and expire tasks
create or replace function public.expire_old_tasks()
returns void as $$
begin
  update public.tasks
  set status = 'expired'
  where status = 'open'
  and due_date < now();
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.expire_old_tasks() to authenticated;
