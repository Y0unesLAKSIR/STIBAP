# Migration Guide: Supabase Auth → Custom Auth

## 🔄 What Changed

Your authentication system has been completely replaced:

### Before (Supabase Auth)
- ❌ Used `auth.users` table (managed by Supabase)
- ❌ Limited control over user data structure
- ❌ Harder to link with custom tables

### After (Custom Auth)
- ✅ Uses custom `profiles` table (you control everything)
- ✅ Server-side bcrypt password hashing
- ✅ Custom session management
- ✅ Easy to link with any other tables
- ✅ Full control over authentication logic

## 🗂️ File Changes

### New Files Created
```
frontend/src/services/customAuth.js       - Authentication service
supabase_custom_auth.sql                  - Database setup script
CUSTOM_AUTH_SETUP.md                      - Complete documentation
```

### Modified Files
```
frontend/src/context/AuthContext.js      - Now uses custom auth
frontend/src/components/Register.js      - Added full name field
frontend/src/components/Home.js          - Updated user data display
```

### Files Removed (Cleanup Complete)
```
frontend/src/utils/profileService.js     - ✅ Deleted (old Supabase auth helpers)
frontend/src/components/ProfileExample.js - ✅ Deleted (example only)
supabase_setup.sql                       - ✅ Deleted (replaced by supabase_custom_auth.sql)
SUPABASE_SETUP.md                        - ✅ Deleted (replaced by CUSTOM_AUTH_SETUP.md)
frontend/src/utils/                      - ✅ Deleted (directory was empty after cleanup)
```

## 📋 Setup Checklist

- [ ] **Step 1:** Open Supabase SQL Editor
- [ ] **Step 2:** Copy and run `supabase_custom_auth.sql`
- [ ] **Step 3:** Verify tables created: `profiles`, `sessions`, `user_activities`, `user_settings`
- [ ] **Step 4:** Run `cd frontend && npm install`
- [ ] **Step 5:** Run `npm start`
- [ ] **Step 6:** Test registration at `/register`
- [ ] **Step 7:** Test login at `/login`
- [ ] **Step 8:** Verify dashboard shows user data at `/home`

## 🔐 Security Features

| Feature | Status |
|---------|--------|
| Bcrypt password hashing (server-side) | ✅ Implemented |
| Secure session tokens | ✅ Implemented |
| Account lockout (5 failed attempts) | ✅ Implemented |
| Session expiration (7 days) | ✅ Implemented |
| Row Level Security (RLS) | ✅ Implemented |
| Password requirements (min 6 chars) | ✅ Implemented |
| Email validation | ✅ Implemented |
| Automatic session cleanup | ✅ Implemented |

## 🔗 Database Relationships

Your `profiles` table is now the main user table. You can easily link it to other tables:

```sql
-- Example: Create a custom table linked to profiles
CREATE TABLE your_custom_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    your_data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

This is much easier than linking to `auth.users`!

## 🎯 What to Do Next

1. **Test the system** - Register and login
2. **Read CUSTOM_AUTH_SETUP.md** - Complete documentation
3. **Customize** - Adjust security settings as needed
4. **Add features** - Build on top of the profiles table
5. **Deploy** - When ready for production

## ⚠️ Important Notes

### Password Security
- Passwords are **never** stored in plain text
- Bcrypt hashing happens **server-side** in the database
- Cost factor of 10 provides strong security
- Even database admins cannot see passwords

### Session Management
- Session tokens are stored in browser localStorage
- Sessions expire after 7 days (configurable)
- Users can be logged out from database if needed

### No Data Loss
- This is a fresh setup, no existing data affected
- If you had test users with Supabase Auth, they won't work anymore
- New users must register with the new system

## 🚀 Quick Test

Run these commands to test:

```bash
# Start the app
cd frontend
npm start

# In browser:
# 1. Go to http://localhost:3000/register
# 2. Register with: test@example.com / password123
# 3. Login with same credentials
# 4. Should see dashboard with your user info
```

## 📊 Verify Database

In Supabase SQL Editor, run:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'sessions', 'user_activities', 'user_settings');

-- Should return 4 rows

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('register_user', 'login_user', 'verify_session', 'logout_user', 'change_password');

-- Should return 5 rows
```

## 🐛 Common Issues

### Issue: Can't register users
**Solution:** Make sure you ran the SQL script in Supabase SQL Editor

### Issue: Login fails immediately
**Solution:** Check browser console for errors. Verify session tokens in localStorage

### Issue: "Function does not exist"
**Solution:** The SQL script didn't run properly. Try running it again

### Issue: RLS errors
**Solution:** Make sure all RLS policies were created by the script

## ✅ Success Indicators

You'll know it's working when:
- ✅ Registration creates a user in `profiles` table
- ✅ Login returns a session token
- ✅ Dashboard shows your email and name
- ✅ Logout clears the session
- ✅ Closing browser and reopening keeps you logged in

## 🎉 Complete!

Your custom authentication system is now active with full password hashing and security!
