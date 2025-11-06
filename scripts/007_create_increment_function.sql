-- Create function to safely increment/decrement credits
create or replace function public.increment(row_id uuid, x integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set credits = credits + x
  where id = row_id;
end;
$$;
