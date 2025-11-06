-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task_request', 'request_approved', 'request_rejected', 'task_completed', 'new_task', 'new_message', 'rating_received')),
  related_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_message text,
  p_type text,
  p_related_task_id uuid DEFAULT NULL,
  p_related_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, message, type, related_task_id, related_user_id)
  VALUES (p_user_id, p_message, p_type, p_related_task_id, p_related_user_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger: Notify poster when helper requests task
CREATE OR REPLACE FUNCTION notify_task_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_title text;
  v_helper_name text;
  v_poster_id uuid;
BEGIN
  -- Get task details
  SELECT title, posted_by INTO v_task_title, v_poster_id
  FROM tasks WHERE id = NEW.task_id;
  
  -- Get helper name
  SELECT full_name INTO v_helper_name
  FROM profiles WHERE id = NEW.helper_id;
  
  -- Create notification for poster
  PERFORM create_notification(
    v_poster_id,
    v_helper_name || ' requested to help with "' || v_task_title || '"',
    'task_request',
    NEW.task_id,
    NEW.helper_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_task_request
AFTER INSERT ON task_requests
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_task_request();

-- Trigger: Notify helper when request is approved/rejected
CREATE OR REPLACE FUNCTION notify_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_title text;
  v_message text;
  v_type text;
BEGIN
  -- Only trigger on status change to approved or rejected
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  
  -- Get task title
  SELECT title INTO v_task_title
  FROM tasks WHERE id = NEW.task_id;
  
  -- Set message and type based on status
  IF NEW.status = 'approved' THEN
    v_message := 'Your request to help with "' || v_task_title || '" was approved!';
    v_type := 'request_approved';
  ELSIF NEW.status = 'rejected' THEN
    v_message := 'Your request to help with "' || v_task_title || '" was declined.';
    v_type := 'request_rejected';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Create notification for helper
  PERFORM create_notification(
    NEW.helper_id,
    v_message,
    v_type,
    NEW.task_id,
    NULL
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_request_status
AFTER UPDATE ON task_requests
FOR EACH ROW
EXECUTE FUNCTION notify_request_status();

-- Trigger: Notify both users when task status changes to awaiting_confirmation or completed
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_title text;
  v_poster_name text;
  v_helper_name text;
BEGIN
  -- Only trigger on status change
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  
  -- Get task and user details
  SELECT title INTO v_task_title FROM tasks WHERE id = NEW.id;
  SELECT full_name INTO v_poster_name FROM profiles WHERE id = NEW.posted_by;
  SELECT full_name INTO v_helper_name FROM profiles WHERE id = NEW.accepted_by;
  
  -- Notify when awaiting confirmation
  IF NEW.status = 'awaiting_confirmation' THEN
    -- Notify the user who didn't confirm yet
    IF NEW.poster_confirmed AND NOT NEW.helper_confirmed THEN
      PERFORM create_notification(
        NEW.accepted_by,
        v_poster_name || ' marked "' || v_task_title || '" as completed. Please confirm.',
        'task_completed',
        NEW.id,
        NEW.posted_by
      );
    ELSIF NEW.helper_confirmed AND NOT NEW.poster_confirmed THEN
      PERFORM create_notification(
        NEW.posted_by,
        v_helper_name || ' marked "' || v_task_title || '" as completed. Please confirm.',
        'task_completed',
        NEW.id,
        NEW.accepted_by
      );
    END IF;
  END IF;
  
  -- Notify both when fully completed
  IF NEW.status = 'completed' AND OLD.status = 'awaiting_confirmation' THEN
    PERFORM create_notification(
      NEW.posted_by,
      'Task "' || v_task_title || '" is now completed! Please rate ' || v_helper_name || '.',
      'task_completed',
      NEW.id,
      NEW.accepted_by
    );
    
    PERFORM create_notification(
      NEW.accepted_by,
      'Task "' || v_task_title || '" is now completed! Please rate ' || v_poster_name || '.',
      'task_completed',
      NEW.id,
      NEW.posted_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_task_completion
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_completion();
