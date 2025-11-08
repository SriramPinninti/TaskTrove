# Database Reset Instructions

## Quick Reset for Testing Email Verification

### Option 1: Run SQL Script (Recommended)

1. **Execute the reset script**:
   - Click the "Run" button on the `999_reset_database.sql` script in v0
   - Or go to your Supabase Dashboard → SQL Editor → Paste the script → Run

2. **Verify the reset**:
   - Check that the script output shows all tables have 0 rows
   - If you see any errors, proceed to Option 2

### Option 2: Manual Reset via Supabase Dashboard

If the SQL script fails (common with auth.users deletion), follow these steps:

1. **Delete Auth Users**:
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
   - Select all users (checkbox at top)
   - Click "Delete users"
   - Confirm deletion

2. **Clear Application Data**:
   - Go to: Table Editor in Supabase Dashboard
   - For each table in this order, click "..." → "Delete all rows":
     1. transactions
     2. ratings
     3. task_requests
     4. messages
     5. notifications
     6. tasks
     7. password_reset_tokens
     8. profiles

### Option 3: Quick CLI Command (If you have Supabase CLI)

\`\`\`bash
# Reset the entire database
supabase db reset
\`\`\`

## After Reset - Testing Email Verification

1. **Register a new user**:
   - Go to: https://axodojo.xyz/auth/signup
   - Use a fresh email address
   - Submit the registration form

2. **Check your email**:
   - Look for the verification email from Supabase
   - Click the verification link

3. **Verify the flow**:
   - You should be redirected to the dashboard (logged in)
   - OR redirected to login page with "Email verified" message
   - Try logging in with your credentials
   - Should login successfully without "email not verified" errors

## Troubleshooting

### "Cannot delete auth.users" Error
- This is expected - you need service_role permissions
- Use Option 2 (Manual Delete) from the Supabase Dashboard

### Users still exist after running script
- Go to Supabase Dashboard → Authentication → Users
- Manually delete all users
- Then re-run the script to clear application data

### Email verification still failing
1. Check Supabase Email Settings:
   - Dashboard → Authentication → Email Templates
   - Confirm redirect URL is: `https://axodojo.xyz/auth/callback`

2. Check middleware.ts is updating sessions:
   - Should have `updateSession()` call
   - Check browser console for `[v0]` debug logs

3. Test with a completely new email address
   - Some email providers cache verification status

## Important Notes

- ⚠️ This will delete ALL data - only use in development
- ✅ Table structures and RLS policies remain intact
- ✅ You can immediately register new users after reset
- ⚠️ Production databases should NEVER be reset this way
