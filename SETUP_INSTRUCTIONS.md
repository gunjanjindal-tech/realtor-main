# Bridge API Integration Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
# Bridge API Configuration
BRIDGE_API_BASE=https://api.bridgedataoutput.com/api/v2/OData
BRIDGE_SERVER_TOKEN=a0aa5b3a9b1a3df0481344d2ec396967
BRIDGE_BROWSER_TOKEN=e0b5886b904ada42603243518847e699
BRIDGE_CLIENT_ID=hFA4X14rgXT5aiXU4XJx
BRIDGE_CLIENT_SECRET=uLqyFqu3np5QZCC469arfe6k5vR8qNWsuMKaRf1O
```

## What's Been Integrated

1. **Updated Bridge Client** (`src/lib/bridgeClient.js`)
   - Server-side API calls use `BRIDGE_SERVER_TOKEN`
   - Client-side API calls use `BRIDGE_BROWSER_TOKEN`
   - Proper error handling and URL formatting

2. **Buy API Route** (`src/app/api/bridge/buy/route.js`)
   - Fetches property listings for buying
   - Supports pagination and city filtering

3. **Sell API Route** (`src/app/api/bridge/sell/route.js`)
   - Fetches property listings for selling
   - Supports pagination and city filtering

4. **Sell Page** (`src/app/sell/page.jsx`)
   - Complete sell page with hero, regions, and property listings
   - Similar structure to buy page

5. **Sell Components**
   - `SellHero.jsx` - Hero section for sell page
   - `SellRegions.jsx` - Region selection component
   - `FeaturedProperties.jsx` - Property listings with pagination

## Usage

- **Buy Properties**: Navigate to `/buy` or `/buy?city=Halifax`
- **Sell Properties**: Navigate to `/sell` or `/sell?city=Halifax`

Both pages will fetch listings from the Bridge API using the configured credentials.

## Important Notes

- Make sure `.env.local` is in your `.gitignore` file
- Restart your Next.js development server after creating/updating `.env.local`
- The API uses OData format with access tokens in query parameters




