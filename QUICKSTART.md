# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

Open a terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

This will install all required React packages including:
- React and React DOM
- React Router for navigation
- Supabase client for authentication

### Step 2: Verify Environment Configuration

The `.env` file in the `frontend` directory already contains your Supabase credentials:
- Supabase URL
- Supabase Anon Key

✅ This is already configured - no action needed!

### Step 3: Start the Development Server

```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

## 📱 Using the App

### Create an Account
1. Click "Sign up" or navigate to `/register`
2. Enter your email and password (minimum 6 characters)
3. Confirm your password
4. Click "Sign Up"
5. Check your email for verification (depending on Supabase settings)

### Log In
1. Go to the login page (default page)
2. Enter your registered email and password
3. Click "Sign In"
4. You'll be redirected to your dashboard

### Dashboard Features
- View your user information (email, user ID, last sign-in)
- Browse app features
- Sign out securely

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is taken:
```bash
# The terminal will ask if you want to use a different port
# Press 'Y' to use the suggested port
```

### Dependencies Installation Failed
```bash
# Clear npm cache and try again
npm cache clean --force
npm install
```

### Supabase Connection Issues
1. Check if your Supabase project is active
2. Verify the credentials in `.env` are correct
3. Check Supabase dashboard for any service issues

## 🐍 Adding Python Backend (Future)

When you're ready to add Python functionality:

1. Navigate to the backend directory:
```bash
cd ../backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate it:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

4. Follow the guide in `backend/README.md`

## 📚 Next Steps

- Customize the UI in `frontend/src/components/`
- Add new routes in `frontend/src/App.js`
- Extend the Supabase schema for additional data
- Implement additional features

## 💡 Tips

- Keep the React dev server running while developing
- Changes will hot-reload automatically
- Check the browser console for any errors
- Use React DevTools for debugging

## 🆘 Need Help?

Check the detailed README files:
- Main project: `README.md`
- Frontend: `frontend/README.md`
- Backend (future): `backend/README.md`

## 🎉 You're All Set!

Your authentication app is ready to use. Start building amazing features!
