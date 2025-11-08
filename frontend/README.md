# Frontend - React Authentication App

This is the React frontend for the STIBAP authentication application.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.js        # Login page
│   ├── Register.js     # Registration page
│   ├── Home.js         # User dashboard
│   ├── ProtectedRoute.js  # Route protection
│   ├── Auth.css        # Auth pages styling
│   └── Home.css        # Dashboard styling
├── context/
│   └── AuthContext.js  # Authentication state management
├── supabaseClient.js   # Supabase configuration
├── App.js              # Main app component with routing
├── index.js            # App entry point
└── index.css           # Global styles
```

## Key Features

### Authentication Context
The `AuthContext` provides:
- `user` - Current user object
- `signUp(email, password)` - Register new user
- `signIn(email, password)` - Login user
- `signOut()` - Logout user
- `loading` - Loading state

### Protected Routes
Routes wrapped with `ProtectedRoute` component require authentication.

### Supabase Integration
- Email/password authentication
- Session management
- Automatic token refresh

## Environment Variables

Required in `.env`:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Routes

- `/` - Redirects to login
- `/login` - Login page
- `/register` - Registration page
- `/home` - Protected user dashboard

## Styling

The app uses modern CSS with:
- Gradient backgrounds
- Smooth animations
- Responsive design
- Hover effects
- Shadow effects

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.
