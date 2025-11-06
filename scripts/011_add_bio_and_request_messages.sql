-- Add bio field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Update messages table to support both task-based and request-based chats
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.task_requests(id) ON DELETE CASCADE;

-- Make task_id nullable since messages can be for requests or tasks
ALTER TABLE public.messages
ALTER COLUMN task_id DROP NOT NULL;

-- Add constraint to ensure either task_id or request_id is set
ALTER TABLE public.messages
ADD CONSTRAINT messages_task_or_request_check 
CHECK (
  (task_id IS NOT NULL AND request_id IS NULL) OR 
  (task_id IS NULL AND request_id IS NOT NULL)
);

-- Update RLS policy for messages to include request-based chats
DROP POLICY IF EXISTS messages_select_own ON public.messages;

CREATE POLICY messages_select_own ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Add index for request_id lookups
CREATE INDEX IF NOT EXISTS messages_request_id_idx ON public.messages(request_id);
