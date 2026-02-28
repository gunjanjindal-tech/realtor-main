# Google Maps API Key Fix - Step by Step (Hindi/English)

## Problem
```
InvalidKeyMapError: API key invalid hai
Current Key: AlzaSyDxOfDi6rq9mNfiwv2aSuLVJJ8bi30fxrQ ❌
```

## Solution - Step by Step

### Step 1: Google Cloud Console में जाएं
1. Browser में खोलें: https://console.cloud.google.com/
2. Login करें (Google account se)
3. Project select करें (या नया project बनाएं)

### Step 2: Maps JavaScript API Enable करें
1. Left sidebar में **APIs & Services** > **Library** click करें
2. Search box में type करें: **"Maps JavaScript API"**
3. **Maps JavaScript API** पर click करें
4. **ENABLE** button click करें
5. Wait करें जब तक "API enabled" message न आए

### Step 3: API Key बनाएं या Check करें
1. **APIs & Services** > **Credentials** पर जाएं
2. **+ CREATE CREDENTIALS** > **API key** click करें
3. या existing key को check करें

### Step 4: API Key Restrictions Set करें (Important!)
1. बने हुए API key पर click करें
2. **Application restrictions** section में:
   - **HTTP referrers (web sites)** select करें
   - **Add an item** click करें
   - Add करें: `localhost:*`
   - Add करें: `127.0.0.1:*`
   - Production के लिए: `yourdomain.com/*` (अगर production है)
3. **API restrictions** section में:
   - **Restrict key** select करें
   - **Maps JavaScript API** check करें
   - **SAVE** click करें

### Step 5: API Key Copy करें
1. API key को copy करें (यह `AIza...` से start होगा)
2. Example: `AIzaSyDxOfDi6rq9mNfiwv2aSuLVJJ8bi30fxrQ` (valid format)

### Step 6: .env.local File Update करें
1. Project folder में `.env.local` file खोलें
2. Update करें:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
   ```
3. Save करें

### Step 7: Server Restart करें (बहुत Important!)
```bash
# Terminal में:
# 1. Current server stop करें (Ctrl+C)
# 2. फिर restart:
npm run dev
```

### Step 8: Browser में Check करें
1. Browser cache clear करें: **Ctrl+Shift+Delete**
2. Page reload करें: **Ctrl+Shift+R** (Hard Refresh)
3. Console check करें - error नहीं होना चाहिए

## Quick Checklist
- [ ] Google Cloud Console में login किया
- [ ] Maps JavaScript API enable किया
- [ ] API key बनाया/check किया
- [ ] API key restrictions set किए (localhost:*)
- [ ] .env.local file update किया
- [ ] Server restart किया
- [ ] Browser cache clear किया

## Common Mistakes
❌ **Server restart नहीं किया** - Environment variables के लिए restart जरूरी है
❌ **API restrictions में localhost नहीं add किया** - localhost:* add करना जरूरी है
❌ **Maps JavaScript API enable नहीं किया** - API enable होना चाहिए
❌ **Browser cache clear नहीं किया** - Old error cache में रह सकता है

## API Key Format
✅ Valid: `AIzaSyDxOfDi6rq9mNfiwv2aSuLVJJ8bi30fxrQ` (AIza से start)
❌ Invalid: `AlzaSyDxOfDi6rq9mNfiwv2aSuLVJJ8bi30fxrQ` (Alza से start - typo)

## Still Not Working?
1. API key को Google Cloud Console में verify करें
2. Billing enable है या नहीं check करें (Google Maps के लिए billing जरूरी हो सकता है)
3. Browser console में exact error message देखें
4. Network tab में API request check करें

