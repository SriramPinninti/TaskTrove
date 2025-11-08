# Database Reset Guide

This guide provides comprehensive instructions for resetting your TaskTrove database to enable fresh user registration and email verification testing.

## ⚠️ Important Warnings

- **ALL USER DATA WILL BE DELETED** - This includes profiles, tasks, messages, ratings, and all authentication records
- **PRODUCTION WARNING** - Never run these scripts on a production database without a full backup
- **IRREVERSIBLE** - Once deleted, data cannot be recovered unless you create a backup first

## 📋 Prerequisites

1. Access to your Supabase project dashboard
2. SQL Editor access with service role privileges
3. Understanding that all existing users will be deleted

## 🔄 Reset Process

### Step 1: Backup (Optional but Recommended)

If you want to preserve existing data before testing:

\`\`\`bash
# Run in Supabase SQL Editor
scripts/RESET_001_backup_users.sql
\`\`\`

This creates timestamped backup tables in a `backup` schema. You can restore from these later if needed.

### Step 2: Delete Application Data

\`\`\`bash
# Run in Supabase SQL Editor or v0 interface
scripts/RESET_002_delete_all_data.sql
\`\`\`

This deletes all data from your application tables (profiles, tasks, messages, etc.) while preserving the table structure and RLS policies.

### Step 3: Delete Authentication Users

\`\`\`bash
# Run in Supabase SQL Editor with service role access
scripts/RESET_003_delete_auth_users.sql
\`\`\`

This deletes all users from Supabase Auth (`auth.users` table). This step requires service role access and must be run from the Supabase dashboard SQL Editor.

**Note:** If you get a permission error, you need to:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query with the contents of this script
4. Run it there (the dashboard has the required service role privileges)

### Step 4: Verify Clean State

\`\`\`bash
# Run in Supabase SQL Editor or v0 interface
scripts/RESET_004_verify_clean_state.sql
\`\`\`

This displays a comprehensive report showing:
- Row count for each table
- Status indicators (✓ CLEAN or ✗ HAS DATA)
- Overall reset status

Look for the message: **"✅ DATABASE FULLY RESET - READY FOR TESTING"**

## 🧪 Testing Email Verification After Reset

Once the database is reset, you can test the email verification flow:

1. **Sign up a new user** at `/auth/signup`
   - Enter email and password
   - Check the email inbox for verification link
   
2. **Click verification link** in email
   - Should redirect to dashboard after successful verification
   - User should be automatically logged in

3. **Test login after verification**
   - Logout and go to `/auth/login`
   - Enter the same email/password
   - Should login successfully without "email not verified" error

4. **Test unverified login (optional)**
   - Sign up another user but don't click verification link
   - Try to login - should see "Email not confirmed" error
   - Should see option to resend verification email

## 🔍 Troubleshooting

### "Permission denied" error on auth.users deletion

**Solution:** Run `RESET_003_delete_auth_users.sql` directly in Supabase SQL Editor (not in v0), as it requires service role privileges.

### Some tables still have data after reset

**Solution:** Check foreign key constraints. Run the scripts in order:
1. RESET_002 (application data)
2. RESET_003 (auth users)
3. RESET_004 (verify)

### Backup schema already exists

**Solution:** The backup script creates timestamped tables, so multiple backups can coexist. Each backup has a unique timestamp suffix.

### Email verification still failing after reset

**Solution:** 
1. Check Supabase redirect URLs are set to `https://axodojo.xyz/auth/callback`
2. Clear browser cookies and localStorage
3. Verify `NEXT_PUBLIC_SITE_URL` environment variable is correct
4. Check Supabase email templates use the correct redirect URL

## 🔐 Security Considerations

- Always backup production data before any reset operation
- Never commit backup data to version control
- Ensure RLS policies are re-enabled after deletion (scripts handle this automatically)
- Test in development environment first before touching production
- Keep backup scripts for at least 30 days after reset

## 📊 Verification Checklist

After running all reset scripts, verify:

- [ ] All application tables show 0 rows
- [ ] auth.users table is empty
- [ ] Verification script shows "✅ DATABASE FULLY RESET"
- [ ] New user signup works
- [ ] Email verification link is received
- [ ] Clicking verification link redirects correctly
- [ ] Login works after verification
- [ ] Unverified users see appropriate error messages

## 🔄 Restoring from Backup

If you created a backup and want to restore:

\`\`\`sql
-- Example: Restore profiles from specific backup
INSERT INTO public.profiles 
SELECT * FROM backup.profiles_20250108_143022;

-- Note: Replace timestamp with your actual backup timestamp
-- Restore other tables similarly if needed
\`\`\`

## 📝 Additional Notes

- The profile trigger will automatically create profiles when users sign up
- RLS policies remain intact after reset
- Database functions and triggers are preserved
- Only data is deleted, not schema or configuration
