# 🔧 CORS Configuration Guide

## The Problem
You're seeing "TypeError: Failed to fetch" errors because your Supabase project is blocking requests from your local development server due to CORS (Cross-Origin Resource Sharing) policy.

## Quick Fix (2-3 minutes)

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project

### Step 2: Configure CORS Settings
1. In your project dashboard, go to **Settings** → **API**
2. Scroll down to find the **CORS** section
3. In the "Allowed origins" field, add these URLs (one per line):
   ```
   https://localhost:5173
   http://localhost:5173
   http://127.0.0.1:5173
   https://127.0.0.1:5173
   ```
4. Click **Save** to apply the changes

### Step 3: Refresh Your Application
1. Go back to your browser tab with the application
2. Do a hard refresh: **Ctrl+F5** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. The errors should be resolved and the app should work normally

## Why This Happens
- CORS is a security feature that prevents websites from making requests to different domains
- Your app runs on `localhost:5173` but tries to connect to `*.supabase.co`
- Without proper CORS configuration, browsers block these cross-origin requests

## Verification
After completing the steps above, you should see:
- ✅ No more "Failed to fetch" errors in the browser console
- ✅ User authentication working properly
- ✅ Posts loading correctly
- ✅ All Supabase features functioning normally

## Alternative Development URLs
If you're using a different development server or port, make sure to add those URLs to the CORS configuration as well. Common alternatives include:
- `http://localhost:3000`
- `http://localhost:8080`
- `http://localhost:4173`

## Production Deployment
When you deploy your app to production, remember to add your production domain to the CORS configuration in the same way.

## Troubleshooting Authentication Issues

### Invalid Refresh Token Error
If you see "Invalid Refresh Token: Refresh Token Not Found" errors:

1. **Automatic Fix**: The application will attempt to clear corrupted session data automatically
2. **Manual Fix** (if automatic doesn't work):
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear all Local Storage and Session Storage for this site
   - Perform a hard refresh: **Ctrl+F5** (Windows/Linux) or **Cmd+Shift+R** (Mac)

### Why This Happens
- Browser stored an invalid or expired authentication token
- Supabase server no longer recognizes the stored session
- Can occur after server maintenance or configuration changes

### Prevention
- Avoid manually editing browser storage
- Use the app's logout function instead of clearing storage manually
- Keep your browser updated to handle authentication properly