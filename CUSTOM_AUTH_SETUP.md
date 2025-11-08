# Custom Authentication System Setup Guide

## 🔐 Overview

This project now uses a **custom authentication system** with:
- ✅ Server-side bcrypt password hashing
- ✅ Secure session management
- ✅ Account lockout after failed attempts
- ✅ Custom user profiles in your database
- ✅ Full control over user data

## 🚀 Setup Instructions

### Step 1: Run the SQL Setup Script

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project: `ibrcdwgyocvqkogxhnqh`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run the Custom Auth Script**
   - Open `supabase_custom_auth.sql` in your project
   - Copy ALL the SQL code
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - You should see: "Custom authentication system installed successfully!"
   - Check "Table Editor" - you should see:
     - `profiles` (user accounts with hashed passwords)
     - `sessions` (active user sessions)
     - `user_activities` (activity logs)
     - `user_settings` (user preferences)

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Start the Application

```bash
npm start
```

The app will open at http://localhost:3000

## 🗃️ Database Schema

### `profiles` Table
Main user table with authentication:
```sql
- id (UUID, Primary Key)
- email (TEXT, Unique, NOT NULL)
- password_hash (TEXT, NOT NULL) -- Bcrypt hashed, never stored in plain text
- full_name (TEXT, Optional)
- avatar_url (TEXT, Optional)
- bio (TEXT, Optional)
- is_active (BOOLEAN, Default: true)
- email_verified (BOOLEAN, Default: false)
- failed_login_attempts (INTEGER, Default: 0)
- locked_until (TIMESTAMP, NULL)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `sessions` Table
Secure session tokens:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to profiles)
- session_token (TEXT, Unique, NOT NULL)
- ip_address (TEXT)
- user_agent (TEXT)
- expires_at (TIMESTAMP, Default: 7 days)
- created_at (TIMESTAMP)
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Bcrypt with cost factor 10 (industry standard) |
| **Session Duration** | 7 days (configurable) |
| **Account Lockout** | 5 failed attempts = 15 minute lockout |
| **Password Requirements** | Minimum 6 characters (customizable) |
| **Email Validation** | Regex pattern validation |
| **Session Cleanup** | Automatic removal of expired sessions |

## 🔧 Database Functions

### Available SQL Functions

#### 1. `register_user(p_email, p_password, p_full_name)`
Registers a new user with hashed password.

**Parameters:**
- `p_email` (TEXT) - User's email address
- `p_password` (TEXT) - Plain text password (hashed server-side)
- `p_full_name` (TEXT, Optional) - User's full name

**Returns:** JSON
```json
{
  "success": true/false,
  "user_id": "uuid",
  "message": "string",
  "error": "string (if failed)"
}
```

#### 2. `login_user(p_email, p_password, p_ip_address, p_user_agent)`
Authenticates user and creates session.

**Parameters:**
- `p_email` (TEXT) - User's email
- `p_password` (TEXT) - Plain text password
- `p_ip_address` (TEXT, Optional) - Client IP
- `p_user_agent` (TEXT, Optional) - Browser user agent

**Returns:** JSON
```json
{
  "success": true/false,
  "user": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "avatar_url": "string",
    "last_login": "timestamp"
  },
  "session_token": "string",
  "expires_at": "timestamp"
}
```

#### 3. `verify_session(p_session_token)`
Verifies if a session is valid.

**Parameters:**
- `p_session_token` (TEXT) - Session token from login

**Returns:** JSON with user data if valid

#### 4. `logout_user(p_session_token)`
Invalidates a session.

#### 5. `change_password(p_session_token, p_old_password, p_new_password)`
Changes user password after verifying old password.

## 📱 React Integration

### Authentication Service (`services/customAuth.js`)

```javascript
import { registerUser, loginUser, logoutUser, verifySession } from '../services/customAuth';

// Register
const result = await registerUser('user@example.com', 'password123', 'John Doe');

// Login
const result = await loginUser('user@example.com', 'password123');
// result.session_token is stored in localStorage automatically

// Verify session
const result = await verifySession();

// Logout
await logoutUser();
```

### Using Auth Context

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  // User object contains: id, email, full_name, avatar_url, etc.
  console.log(user);
}
```

## 🔒 Security Best Practices

### ✅ Implemented

1. **Server-side password hashing** - Passwords are hashed in the database, never in the browser
2. **Bcrypt algorithm** - Industry-standard, resistant to rainbow tables and brute force
3. **Session tokens** - Cryptographically secure random tokens
4. **Account lockout** - Prevents brute force attacks
5. **Row Level Security (RLS)** - Users can only access their own data
6. **SQL injection prevention** - Using parameterized queries
7. **Session expiration** - 7-day automatic expiration
8. **HTTPS only** - Tokens should only be transmitted over HTTPS in production

### 🔐 Additional Recommendations

1. **Enable HTTPS** - Always use HTTPS in production
2. **Rate limiting** - Consider adding Supabase Edge Functions for rate limiting
3. **Email verification** - Add email verification flow for production
4. **2FA** - Consider adding two-factor authentication
5. **Password strength meter** - Add to registration form
6. **Remember me** - Implement longer session duration option
7. **Audit logs** - Use `user_activities` table to track important actions

## 🧪 Testing the System

### Test Registration

1. Go to `/register`
2. Fill in:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Sign Up"
4. Should redirect to login with success message

### Test Login

1. Go to `/login`
2. Enter credentials from registration
3. Should redirect to `/home` with user data displayed

### Test Session Persistence

1. Login successfully
2. Close the browser
3. Reopen and go to http://localhost:3000
4. Should still be logged in (session persists)

### Test Security Features

**Test Account Lockout:**
1. Try logging in with wrong password 5 times
2. Account should be locked for 15 minutes
3. Wait 15 minutes or manually reset in database:
```sql
UPDATE profiles SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'your@email.com';
```

## 🔧 Customization

### Change Session Duration

Edit in SQL function `login_user`:
```sql
v_expires_at := NOW() + INTERVAL '7 days';  -- Change to '30 days', '1 hour', etc.
```

### Change Lockout Policy

Edit in SQL function `login_user`:
```sql
WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
-- Change 5 to different threshold, 15 minutes to different duration
```

### Change Password Requirements

Edit in SQL function `register_user`:
```sql
IF LENGTH(p_password) < 6 THEN  -- Change 6 to different minimum
```

Also update in `Register.js`:
```javascript
if (password.length < 6) {  // Keep in sync with database
```

### Change Bcrypt Cost Factor

Edit in SQL:
```sql
crypt(p_password, gen_salt('bf', 10))  -- Change 10 to 11, 12, etc. (higher = slower but more secure)
```

## 📊 Monitoring and Maintenance

### Check Active Sessions

```sql
SELECT 
  s.id,
  s.user_id,
  p.email,
  s.created_at,
  s.expires_at,
  s.ip_address
FROM sessions s
JOIN profiles p ON s.user_id = p.id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;
```

### Manually Cleanup Expired Sessions

```sql
SELECT cleanup_expired_sessions();
```

### View Failed Login Attempts

```sql
SELECT 
  email,
  failed_login_attempts,
  locked_until,
  last_login
FROM profiles
WHERE failed_login_attempts > 0
ORDER BY failed_login_attempts DESC;
```

### Reset User Password (Admin)

```sql
UPDATE profiles
SET password_hash = crypt('new_password', gen_salt('bf', 10)),
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'user@example.com';
```

## 🐛 Troubleshooting

### "function register_user does not exist"
- Run the `supabase_custom_auth.sql` script in SQL Editor
- Make sure it completed without errors

### "Invalid email or password" even with correct credentials
- Check if account is locked: `SELECT locked_until FROM profiles WHERE email = 'your@email.com'`
- Reset lockout: `UPDATE profiles SET locked_until = NULL, failed_login_attempts = 0 WHERE email = 'your@email.com'`

### Session not persisting
- Check browser localStorage has `stibap_session_token`
- Verify session hasn't expired in database
- Check browser console for errors

### RLS blocking access
- Verify RLS policies are correctly set up
- Check that functions have `SECURITY DEFINER` flag

## 🔄 Migration from Supabase Auth

If you had existing users with Supabase Auth:

1. Export users from Supabase Auth
2. Create migration script to copy to custom profiles table
3. Users will need to reset passwords (passwords can't be transferred)
4. Or implement a one-time migration flow

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Check Supabase logs in Dashboard > Logs
3. Verify SQL functions are installed correctly
4. Test functions directly in SQL Editor

## 📚 Next Steps

1. ✅ Test the registration and login flow
2. ✅ Customize security settings for your needs
3. 📧 Implement email verification (optional)
4. 🔐 Add password reset functionality (optional)
5. 🎨 Customize the UI
6. 🐍 Add Python backend features
7. 🚀 Deploy to production

## 🎉 You're All Set!

Your custom authentication system is fully functional and secure!
