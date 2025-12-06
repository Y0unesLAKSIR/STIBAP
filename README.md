# STIBAP - Authentication Application

A modern authentication application built with React and Supabase, structured to support future Python backend integration.

## Project Structure

```
STIBAP/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   └── supabaseClient.js
│   └── package.json
│
└── backend/          # Future Python backend (to be added)
```

## Features

- 🔐 **User Authentication** - Secure login and registration with Supabase
- 🎨 **Modern UI** - Beautiful, responsive design with CSS animations
- 🛡️ **Protected Routes** - Secure pages that require authentication
- 🚀 **Scalable Architecture** - Ready for Python backend integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file is already configured with Supabase credentials

4. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

### Registration
1. Navigate to the register page
2. Enter your email and password
3. Confirm your password
4. Check your email for verification (if enabled in Supabase)

### Login
1. Navigate to the login page
2. Enter your registered email and password
3. Click "Sign In" to access your dashboard

### Dashboard
- View your user information
- Access protected features
- Sign out securely

## Supabase Configuration

The project uses Supabase for authentication. Make sure your Supabase project has:
- Email authentication enabled
- Proper email templates configured (optional)
- CORS settings configured for your domain

## Future Python Integration

The project structure supports adding a Python backend:

1. Create a `backend/` directory
2. Set up Flask/FastAPI application
3. Connect to Supabase using Python SDK
4. Create API endpoints for additional features
5. Configure CORS to communicate with React frontend

Example structure:
```
backend/
├── app.py              # Main Flask/FastAPI application
├── requirements.txt    # Python dependencies
├── models/            # Database models
├── routes/            # API routes
└── utils/             # Helper functions
```

## Available Scripts

In the `frontend` directory:

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- **React** - Frontend framework
- **React Router** - Navigation and routing
- **Supabase** - Backend as a Service (BaaS) for authentication and database
- **CSS3** - Styling with modern animations

## Security Notes

- Never commit `.env` files with real credentials to public repositories
- Always use environment variables for sensitive data
- Enable email verification in Supabase for production
- Consider adding additional security measures like rate limiting

## License

This project is private and confidential.
