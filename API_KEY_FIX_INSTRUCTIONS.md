# Google Maps API Key Fix - Important!

## Current Error
```
InvalidKeyMapError: The API key `AlzaSyDxOfDi6rq9mNfiwv2aSuLVJJ8bi30fxrQ` is invalid
```

## Solution Steps

### Step 1: Verify API Key in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find or create an API key

### Step 2: Enable Required APIs

Make sure these APIs are **ENABLED**:
- ✅ **Maps JavaScript API** (REQUIRED)
- ✅ **Places API** (Optional but recommended)
- ✅ **Geocoding API** (Optional)

To enable:
1. Go to **APIs & Services** > **Library**
2. Search for "Maps JavaScript API"
3. Click **Enable**

### Step 3: Configure API Key Restrictions

1. Click on your API key in **Credentials**
2. Under **Application restrictions**:
   - For development: Select **HTTP referrers (web sites)**
   - Add: `localhost:*` and `127.0.0.1:*`
   - For production: Add your domain (e.g., `yourdomain.com/*`)
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose **Maps JavaScript API**
   - Save

### Step 4: Update .env.local

Make sure your `.env.local` file has:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_VALID_API_KEY_HERE
```

### Step 5: Restart Server

**IMPORTANT**: After updating `.env.local`, you MUST restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Testing

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R)
3. Check browser console - errors should be gone

## Common Issues

### Issue: "InvalidKeyMapError" persists
- **Solution**: Verify the API key is correct and Maps JavaScript API is enabled

### Issue: Map loads but shows error
- **Solution**: Check API key restrictions allow `localhost:*`

### Issue: Works in dev but not production
- **Solution**: Add your production domain to API key restrictions

## Note

The API key format should start with `AIza...` for Google Maps. If your key doesn't start with this, it might be incorrect.

