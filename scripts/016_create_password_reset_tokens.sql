-- Create password_reset_tokens table for storing temporary passwords
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temporary_password TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only system/service can insert password reset tokens
CREATE POLICY "password_reset_tokens_insert_system" ON password_reset_tokens
  FOR INSERT WITH CHECK (true);

-- Users cannot directly select their own reset tokens (for security)
CREATE POLICY "password_reset_tokens_select_none" ON password_reset_tokens
  FOR SELECT USING (false);
