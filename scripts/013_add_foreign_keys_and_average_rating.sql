-- Add average_rating column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.average_rating IS 'Average rating from 0.00 to 5.00, calculated from ratings table';

-- Add foreign key constraints to validate relationships

-- Tasks table foreign keys
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_posted_by_fkey,
DROP CONSTRAINT IF EXISTS tasks_accepted_by_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_posted_by_fkey 
  FOREIGN KEY (posted_by) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT tasks_accepted_by_fkey 
  FOREIGN KEY (accepted_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- Task requests foreign keys
ALTER TABLE public.task_requests
DROP CONSTRAINT IF EXISTS task_requests_task_id_fkey,
DROP CONSTRAINT IF EXISTS task_requests_helper_id_fkey;

ALTER TABLE public.task_requests
ADD CONSTRAINT task_requests_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES public.tasks(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT task_requests_helper_id_fkey 
  FOREIGN KEY (helper_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Transactions foreign keys
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_task_id_fkey,
DROP CONSTRAINT IF EXISTS transactions_from_user_fkey,
DROP CONSTRAINT IF EXISTS transactions_to_user_fkey,
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES public.tasks(id) 
  ON DELETE SET NULL,
ADD CONSTRAINT transactions_from_user_fkey 
  FOREIGN KEY (from_user) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL,
ADD CONSTRAINT transactions_to_user_fkey 
  FOREIGN KEY (to_user) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL,
ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Ratings foreign keys
ALTER TABLE public.ratings
DROP CONSTRAINT IF EXISTS ratings_task_id_fkey,
DROP CONSTRAINT IF EXISTS ratings_rated_by_fkey,
DROP CONSTRAINT IF EXISTS ratings_rated_user_fkey;

ALTER TABLE public.ratings
ADD CONSTRAINT ratings_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES public.tasks(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT ratings_rated_by_fkey 
  FOREIGN KEY (rated_by) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT ratings_rated_user_fkey 
  FOREIGN KEY (rated_user) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Messages foreign keys
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_task_id_fkey,
DROP CONSTRAINT IF EXISTS messages_request_id_fkey,
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES public.tasks(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT messages_request_id_fkey 
  FOREIGN KEY (request_id) 
  REFERENCES public.task_requests(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Create function to update average rating
CREATE OR REPLACE FUNCTION update_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the average rating for the rated user
  UPDATE public.profiles
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.ratings
    WHERE rated_user = NEW.rated_user
      AND is_hidden = false
  )
  WHERE id = NEW.rated_user;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update average rating when a rating is added or updated
DROP TRIGGER IF EXISTS update_average_rating_trigger ON public.ratings;
CREATE TRIGGER update_average_rating_trigger
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_average_rating();

-- Backfill average ratings for existing users
UPDATE public.profiles
SET average_rating = (
  SELECT COALESCE(AVG(rating), 0)
  FROM public.ratings
  WHERE rated_user = profiles.id
    AND is_hidden = false
);

-- Add check constraints for data validation
ALTER TABLE public.ratings
DROP CONSTRAINT IF EXISTS ratings_rating_check;

ALTER TABLE public.ratings
ADD CONSTRAINT ratings_rating_check 
  CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_average_rating_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_average_rating_check 
  CHECK (average_rating >= 0 AND average_rating <= 5);

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_credits_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_credits_check 
  CHECK (credits >= 0);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_posted_by ON public.tasks(posted_by);
CREATE INDEX IF NOT EXISTS idx_tasks_accepted_by ON public.tasks(accepted_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_requests_task_id ON public.task_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_task_requests_helper_id ON public.task_requests(helper_id);
CREATE INDEX IF NOT EXISTS idx_task_requests_status ON public.task_requests(status);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON public.transactions(from_user);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON public.transactions(to_user);
CREATE INDEX IF NOT EXISTS idx_transactions_task_id ON public.transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON public.ratings(rated_user);
CREATE INDEX IF NOT EXISTS idx_ratings_task_id ON public.ratings(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON public.messages(request_id);
