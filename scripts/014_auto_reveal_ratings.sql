-- Function to automatically reveal ratings after 24 hours
CREATE OR REPLACE FUNCTION reveal_old_ratings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reveal ratings that are more than 24 hours old and still hidden
  UPDATE ratings
  SET is_hidden = false
  WHERE is_hidden = true
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a function that can be called periodically to reveal old ratings
-- This should be called on page loads or via a cron job
COMMENT ON FUNCTION reveal_old_ratings() IS 'Reveals ratings that are older than 24 hours';
