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
  const limitParam = searchParams.get("limit") || searchParams.get("$top") || "9";
  const limit = (limitParam === "max" || limitParam === "all") ? 200 : Number(limitParam);
  const city = searchParams.get("city");
  const query = searchParams.get("q") || searchParams.get("query") || "";

  const skip = (page - 1) * (isNaN(limit) ? 9 : limit);

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

  // Add search query support (search within new developments)
  if (query && query.trim().length > 0) {
    const searchTermLower = query.trim().toLowerCase();
    const words = searchTermLower.split(/\s+/).filter((w) => w.length > 0);

    if (words.length > 0) {
      const escapedQuery = searchTermLower.replace(/'/g, "''");

      // Priority 1: Try exact match on UnparsedAddress
      const exactMatchCondition = `tolower(UnparsedAddress) eq '${escapedQuery}'`;

      // Priority 2: Try partial exact match
      const partialExactMatch = `contains(tolower(UnparsedAddress),'${escapedQuery}')`;

      // Priority 3: Word-based matching
      const streetSuffixMap = {
        'street': 'st', 'road': 'rd', 'avenue': 'ave', 'drive': 'dr',
        'boulevard': 'blvd', 'lane': 'ln', 'court': 'ct', 'circle': 'cir',
        'place': 'pl', 'way': 'way', 'terrace': 'ter', 'parkway': 'pkwy',
        'highway': 'hwy',
      };
      const streetSuffixes = new Set(Object.keys(streetSuffixMap));

      const wordConditions = words.map((word) => {
        const escaped = word.replace(/'/g, "''");
        const isSuffix = streetSuffixes.has(word);

        if (isSuffix) {
          return `(StreetName ne null and contains(tolower(StreetName),'${escaped}'))`;
        }

        return `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}') or (StreetName ne null and contains(tolower(StreetName),'${escaped}'))) `;
      });

      const useOrLogic = words.length === 1 && !words.some(w => streetSuffixes.has(w));
      const wordLogic = useOrLogic
        ? wordConditions.join(" or ")
        : wordConditions.join(" and ");

      const searchCondition = `(${exactMatchCondition} or ${partialExactMatch} or (${wordLogic}))`;
      filterParts.push(searchCondition);
    }
  }

  const filterQuery = filterParts.join(" and ");
  
  // Zillow-style Architecture:
  // 1. countOnly=true -> Return only the total count (uses $top=0 for speed)
  // 2. pinsOnly=true -> Return only minimal data for many properties (up to 5000) for map clustering
  // 3. Standard -> Return a detailed set of listings for the sidebar (typically 40 per page)
  const countOnly = searchParams.get("countOnly") === "true";
  const pinsOnly = searchParams.get("pinsOnly") === "true";
  
  const requestedLimit = searchParams.get("limit") || searchParams.get("$top");
  let topLimit;
  
  if (countOnly) {
    topLimit = 0;
  } else if (pinsOnly) {
    topLimit = 200; // MUST cap at 200 per request to avoid API error
  } else {
    topLimit = Math.min(Number(requestedLimit || 40), 200); // Sidebar page size
  }

  // Use OData syntax: $top, $skip, $filter
  const selectQuery = pinsOnly ? "&$select=ListingId,Latitude,Longitude,ListPrice,StandardStatus" : "";
  let endpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;

  try {
    let data;
    let pinsData = [];

    // For pinsOnly, we fetch multiple pages in parallel to get up to 1000 results
    // while strictly respecting the 200-item per-request limit.
    if (pinsOnly) {
      const pageOffsets = [0, 200, 400, 600, 800]; // 5 pages of 200 = 1000 results
      const fetchPromises = pageOffsets.map(offset => {
        const pEndpoint = `/${DATASET_ID}/Listings?$top=200&$skip=${skip + offset}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;
        return bridgeFetch(pEndpoint).catch(async (err) => {
          // Fallback to Properties for each page if Listings fails
          if (err.message.includes("404") || err.message.includes("Invalid resource")) {
            const propEndpoint = `/${DATASET_ID}/Properties?$top=200&$skip=${skip + offset}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;
            return bridgeFetch(propEndpoint);
          }
          throw err;
        });
      });

      const results = await Promise.all(fetchPromises);
      data = results[0]; // Use first page for metadata (total count)
      pinsData = results.flatMap(r => r.value || r.bundle || []);
    } else {
      try {
        data = await bridgeFetch(endpoint);
      } catch (listingsError) {
        if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
          endpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;
          data = await bridgeFetch(endpoint);
        } else if (listingsError.message.includes("400") || listingsError.message.includes("Bad Request")) {
          // Simplified fallback for new developments
          const simpleFilterParts = ["PropertyType eq 'Residential'", "StandardStatus eq 'Active'"];
          const simpleCityFilter = buildCityFilter(city);
          if (simpleCityFilter) simpleFilterParts.push(simpleCityFilter);
          const simpleFilter = simpleFilterParts.join(" and ");
          const simpleEndpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}&$count=true${selectQuery}`;
          data = await bridgeFetch(simpleEndpoint);
        } else {
          throw listingsError;
        }
      }
    }

    const total = Number(data["@odata.count"] || data["@count"] || data.total || 0);

    // If countOnly was requested, return immediately
    if (countOnly) {
      return Response.json({ total, listings: [] });
    }

    const listingsFromAllPages = pinsOnly ? pinsData : (data.value || data.bundle || []);
    const listings = listingsFromAllPages.map((item) => {
      // Common fields
      const base = {
        ListingId: item.ListingId,
        Id: item.Id,
        ListPrice: item.ListPrice,
        Latitude: item.Latitude || item.LatitudeDecimal,
        Longitude: item.Longitude || item.LongitudeDecimal,
        StandardStatus: item.StandardStatus,
      };

      if (pinsOnly) return base;

      // Full details for sidebar
      return {
        ...base,
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
        BuildingAreaTotal: item.BuildingAreaTotal,
        LivingArea: item.LivingArea,
        AboveGradeFinishedArea: item.AboveGradeFinishedArea,
        PostalCode: item.PostalCode,
        Description: item.PublicRemarks || item.Remarks || item.LongDescription,
        Image:
          item.Media?.[0]?.MediaURL ||
          item.Media?.[0]?.MediaURLThumb ||
          item.Photos?.[0]?.Uri ||
          item.PhotoUrl ||
          null,
        Images: item.Media?.map(m => m.MediaURL || m.MediaURLThumb).filter(Boolean) ||
                item.Photos?.map(p => p.PhotoUrl || p.Uri).filter(Boolean) ||
                (item.PhotoUrl ? [item.PhotoUrl] : []),
      };
    });

    // OData standard: @odata.count contains total count
    return Response.json(
      { listings, total },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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

