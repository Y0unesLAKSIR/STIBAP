# Changelog

All notable changes to this project will be documented in this file.

## [Latest] - 2025-11-08

### Added
- ✅ Custom authentication system with server-side bcrypt password hashing
- ✅ Secure session management with 7-day expiration
- ✅ Account lockout after 5 failed login attempts (15 min cooldown)
- ✅ Full name field in registration
- ✅ Constants file for auth configuration (`constants/auth.js`)
- ✅ CSS file for ProtectedRoute component
- ✅ Complete documentation (CUSTOM_AUTH_SETUP.md, MIGRATION_GUIDE.md)

### Changed
- ✅ Replaced Supabase Auth with custom database functions
- ✅ Updated `profiles` table to store passwords and user data
- ✅ Refactored AuthContext to use custom authentication service
- ✅ Improved Home.js - removed user info display (data still available via context)
- ✅ Enhanced Register.js with constants and better validation
- ✅ Fixed useEffect dependency warning in AuthContext with useCallback
- ✅ Replaced inline styles with CSS classes throughout

### Removed
- ✅ Unused `profileService.js` (old Supabase auth helpers)
- ✅ Unused `ProfileExample.js` (example component)
- ✅ Old `supabase_setup.sql` and `SUPABASE_SETUP.md` files
- ✅ Empty `utils` directory
- ✅ All inline styles from components

### Fixed
- ✅ Code smell: Missing useEffect dependencies
- ✅ Code smell: Magic numbers replaced with constants
- ✅ Code smell: Inline styles converted to CSS
- ✅ Code smell: Hardcoded error messages extracted to constants

### Security
- ✅ Server-side password hashing (never in browser)
- ✅ Bcrypt algorithm with cost factor 10
- ✅ Session token storage in localStorage
- ✅ Row Level Security (RLS) policies
- ✅ Automatic session cleanup

## Project Structure

```
STIBAP/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.css
│   │   │   ├── Home.css
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── ProtectedRoute.css (new)
│   │   │   ├── ProtectedRoute.js
│   │   │   └── Register.js
│   │   ├── constants/
│   │   │   └── auth.js (new)
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── customAuth.js (new)
│   │   ├── App.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── supabaseClient.js
│   ├── public/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── README.md
├── backend/
│   └── README.md
├── .gitignore
├── CHANGELOG.md (new)
├── CUSTOM_AUTH_SETUP.md (new)
├── MIGRATION_GUIDE.md (new)
├── QUICKSTART.md
├── README.md
└── supabase_custom_auth.sql (new)
```
