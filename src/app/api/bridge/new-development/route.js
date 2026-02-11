import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

// MLS mein kuch cities doosre naam se bhi hoti hain – dono se match karke sab cities pe results aayein
const CITY_ALIASES = {
  "Cole Harbour": ["Dartmouth", "Cole Harbour"],
  "Lower Sackville": ["Sackville", "Lower Sackville"],
  "Chester": ["Chester", "Chester Basin", "Mahone Bay"],
  "Lunenburg": ["Lunenburg", "Mahone Bay"],
  "Kentville": ["Kentville", "New Minas"],
  "Wolfville": ["Wolfville", "New Minas"],
  "Antigonish": ["Antigonish", "St Andrews"],
  "Bridgewater": ["Bridgewater", "Lunenburg"],
  "Yarmouth": ["Yarmouth", "Argyle"],
};

function buildCityFilter(city) {
  if (!city || !city.trim()) return null;
  const trimmed = city.trim();
  const key = Object.keys(CITY_ALIASES).find((k) => k.toLowerCase() === trimmed.toLowerCase());
  const terms = key ? CITY_ALIASES[key] : [trimmed];
  const escaped = [...new Set(terms)].map((t) => t.toLowerCase().replace(/'/g, "''"));
  if (escaped.length === 1) return `contains(tolower(City),'${escaped[0]}')`;
  return `(${escaped.map((t) => `contains(tolower(City),'${t}')`).join(" or ")})`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 9);
  const city = searchParams.get("city");

  const skip = (page - 1) * limit;

  // Build OData $filter query for New Development
  // New Development typically means new construction or pre-construction
  // We'll filter by YearBuilt (properties built in recent years) or PropertySubType
  const filterParts = [
    "PropertyType eq 'Residential'",
    "StandardStatus eq 'Active'"
  ];

  // Try to filter for new developments - properties built in last 5 years
  // If YearBuilt filter fails, we'll fallback to basic active listings
  const currentYear = new Date().getFullYear();
  const fiveYearsAgo = currentYear - 5;
  
  // Add new development filter - properties built after 2019
  // This is a simple filter that should work with most Bridge API datasets
  filterParts.push(`YearBuilt ge ${fiveYearsAgo}`);

  const cityFilter = buildCityFilter(city);
  if (cityFilter) filterParts.push(cityFilter);

  const filterQuery = filterParts.join(" and ");
  
  // $count=true so Bridge returns @odata.count and we show correct total / pagination (sab property)
  let endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}&$count=true`;

  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [NEW-DEV] Fetching from endpoint:", endpoint);
    }
    let data;
    
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}&$count=true`;
        data = await bridgeFetch(endpoint);
      } else if (listingsError.message.includes("400") || listingsError.message.includes("Bad Request")) {
        // If filter fails (e.g., YearBuilt or tolower not available), try simpler filter
        const simpleFilterParts = [
          "PropertyType eq 'Residential'",
          "StandardStatus eq 'Active'"
        ];
        const simpleCityFilter = buildCityFilter(city);
        if (simpleCityFilter) simpleFilterParts.push(simpleCityFilter);
        const simpleFilter = simpleFilterParts.join(" and ");
        endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}&$count=true`;
        
        try {
          data = await bridgeFetch(endpoint);
        } catch (simpleError) {
          if (simpleError.message.includes("404") || simpleError.message.includes("Invalid resource")) {
            endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}&$count=true`;
            data = await bridgeFetch(endpoint);
          } else {
            throw simpleError;
          }
        }
      } else {
        throw listingsError;
      }
    }

    const listingsFromQuery = data.value || data.bundle || [];

    // If city was requested but we got 0 results (e.g. no new builds in last 5 years), try without YearBuilt
    if (city && city.trim() && listingsFromQuery.length === 0) {
      const fallbackFilterParts = [
        "PropertyType eq 'Residential'",
        "StandardStatus eq 'Active'",
      ];
      const fallbackCityFilter = buildCityFilter(city);
      if (fallbackCityFilter) fallbackFilterParts.push(fallbackCityFilter);
      const fallbackFilter = fallbackFilterParts.join(" and ");
      const fallbackEndpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(fallbackFilter)}&$count=true`;
      try {
        const fallbackData = await bridgeFetch(fallbackEndpoint);
        const fallbackListings = fallbackData.value || fallbackData.bundle || [];
        if (fallbackListings.length > 0) {
          data = fallbackData;
        }
      } catch (_) {
        // Keep original (empty) data
      }
    }

    // OData standard uses 'value' array, but some APIs use 'bundle'
    const listings = (data.value || data.bundle || []).map((item) => ({
      ListingId: item.ListingId,
      Id: item.Id,

      ListPrice: item.ListPrice,
      City: item.City,
      Province: item.Province || item.StateOrProvince,
      UnparsedAddress: item.UnparsedAddress,
      StreetNumber: item.StreetNumber,
      StreetName: item.StreetName,
      YearBuilt: item.YearBuilt,
      PropertySubType: item.PropertySubType,
      PropertyType: item.PropertyType,

      BedroomsTotal: item.BedroomsTotal,
      BathroomsTotalInteger: item.BathroomsTotalInteger,
      BathroomsTotal: item.BathroomsTotal,

      // SQ FT
      BuildingAreaTotal: item.BuildingAreaTotal,
      LivingArea: item.LivingArea,
      AboveGradeFinishedArea: item.AboveGradeFinishedArea,

      // Coordinates for map
      Latitude: item.Latitude || item.LatitudeDecimal,
      Longitude: item.Longitude || item.LongitudeDecimal,

      // Additional details
      PostalCode: item.PostalCode,
      StandardStatus: item.StandardStatus,
      Description: item.PublicRemarks || item.Remarks || item.LongDescription,

      // Image
      Image:
        item.Media?.[0]?.MediaURL ||
        item.Media?.[0]?.MediaURLThumb ||
        item.Photos?.[0]?.Uri ||
        item.PhotoUrl ||
        null,
      
      // All images for gallery
      Images: item.Media?.map(m => m.MediaURL || m.MediaURLThumb).filter(Boolean) ||
              item.Photos?.map(p => p.PhotoUrl || p.Uri).filter(Boolean) ||
              (item.PhotoUrl ? [item.PhotoUrl] : []),
    }));

    // OData standard: @odata.count contains total count
    const total = data["@odata.count"] || data["@count"] || data.total || listings.length;

    return Response.json(
      { listings, total },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    const errorMessage = err.message || "Failed to fetch new development listings";
    const is404 = errorMessage.includes("404") || errorMessage.includes("Invalid resource");
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403");
    
    console.error("❌ New Development API Route Error:", {
      message: errorMessage,
      status: is404 ? 404 : isAuthError ? 401 : 500,
      endpoint: endpoint,
      datasetId: DATASET_ID,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    
    // Always return JSON, even on error
    return Response.json(
      { 
        error: errorMessage,
        listings: [],
        total: 0,
        debug: process.env.NODE_ENV === "development" ? {
          endpoint,
          datasetId: DATASET_ID,
          suggestion: is404 ? "Check if dataset ID or endpoint name is correct. Try /api/bridge/test to verify." : undefined
        } : undefined
      }, 
      { 
        status: is404 ? 404 : isAuthError ? 401 : 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}

