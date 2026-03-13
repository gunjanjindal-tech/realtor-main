# Debugging "No Products Found" Issue

## Quick Debug Steps

### 1. Check Server Logs
Development server console mein yeh logs dikhne chahiye:
- `🔍 Fetching from endpoint: ...`
- `🌐 Bridge API URL: ...`
- `✅ API Response received: ...`
- `📦 Raw API Response structure: ...`

### 2. Test API Connection
Browser mein yeh URL open karein:
```
http://localhost:3000/api/bridge/test
```

Yeh endpoint API connection test karega aur response structure dikhayega.

### 3. Check Environment Variables
Verify karein ki `.env.local` file mein sab credentials sahi hain:
```env
BRIDGE_API_BASE=https://api.bridgedataoutput.com/api/v2/OData
BRIDGE_SERVER_TOKEN=a0aa5b3a9b1a3df0481344d2ec396967
```

### 4. Check Browser Console
Frontend console mein yeh logs dikhne chahiye:
- `📊 Frontend received data: ...`
- `❌ API Error Response: ...` (agar error ho)

## Common Issues & Solutions

### Issue 1: API Base URL Wrong
**Symptom**: 404 errors ya "endpoint not found"
**Solution**: Verify API base URL Bridge documentation se

### Issue 2: Token Invalid
**Symptom**: 401/403 errors
**Solution**: 
- Verify token `.env.local` mein sahi hai
- Server restart karein after updating `.env.local`

### Issue 3: Dataset ID Wrong
**Symptom**: Empty response ya wrong data
**Solution**: Check `/api/bridge/datasets` endpoint se available datasets

### Issue 4: Response Format Different
**Symptom**: Data hai but `bundle` nahi mil raha
**Solution**: Code ab `bundle` aur `value` dono handle karta hai (OData standard)

### Issue 5: Query Parameters Wrong
**Symptom**: No results with filters
**Solution**: Try without filters first: `/${DATASET_ID}/listings?$top=5`

## Testing Endpoints

1. **Test Connection**: `/api/bridge/test`
2. **List Datasets**: `/api/bridge/datasets`
3. **Buy Listings**: `/api/bridge/buy?page=1&limit=9`
4. **Sell Listings**: `/api/bridge/sell?page=1&limit=9`

## Next Steps

1. Server restart karein: `npm run dev`
2. Test endpoint open karein: `http://localhost:3000/api/bridge/test`
3. Console logs check karein
4. Agar error aaye, error message share karein




