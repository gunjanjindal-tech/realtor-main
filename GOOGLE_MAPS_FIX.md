# Google Maps API Key Fix

## Problem
Google Maps showing "InvalidKeyMapError" - API key is invalid or not properly configured.

## Solutions

### Option 1: Verify API Key in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find your API key: `AlzaSyDxOfDi6rq9mNfiwv2aSuLVJJ8bi30fxrQ`
5. Check:
   - ✅ **Maps JavaScript API** is enabled
   - ✅ API key restrictions allow your domain (localhost for dev, your domain for production)
   - ✅ API key is not expired or deleted

### Option 2: Enable Required APIs

Make sure these APIs are enabled in Google Cloud Console:
- ✅ **Maps JavaScript API** (Required)
- ✅ **Places API** (Optional, for better features)
- ✅ **Geocoding API** (Optional, for address lookup)

### Option 3: Check API Key Restrictions

If you have restrictions on your API key:
1. Go to API key settings
2. Under "Application restrictions":
   - For development: Allow HTTP referrers with `localhost:*` and `127.0.0.1:*`
   - For production: Add your domain (e.g., `yourdomain.com/*`)
3. Under "API restrictions":
   - Select "Restrict key" and choose "Maps JavaScript API"

### Option 4: Create a New API Key

If the current key doesn't work:
1. Create a new API key in Google Cloud Console
2. Update `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
   ```
3. Restart your development server

## After Making Changes

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache** and reload the page

3. **Check browser console** for any remaining errors

## Code Changes Made

- Added better error handling for invalid API keys
- Added libraries parameter to useJsApiLoader
- Improved error messages to guide users

## Notes

- The API key must start with `AIza` for Google Maps
- Environment variables require server restart to take effect
- Make sure `.env.local` is in the project root (not in `src/`)

