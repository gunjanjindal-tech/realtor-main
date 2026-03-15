// Ensure this route is properly registered by Next.js
// If you see 404 errors, try:
// 1. Restart the Next.js dev server
// 2. Clear .next folder: rm -rf .next (or delete .next folder)
// 3. Check that BRIDGE_SERVER_TOKEN is set in .env.local

import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

// Map showcase area names to OData filter so API returns all relevant properties
const AREA_TO_FILTER = {
  "Halifax Waterfront": "contains(City, 'Halifax')",
  "South Shore": "(contains(City, 'Lunenburg') or contains(City, 'Bridgewater') or contains(City, 'Liverpool') or contains(City, 'Chester') or contains(City, 'Mahone') or contains(City, 'Shelburne'))",
  "Annapolis Valley": "(contains(City, 'Kentville') or contains(City, 'Wolfville') or contains(City, 'Annapolis') or contains(City, 'Berwick') or contains(City, 'Middleton'))",
  "Cape Breton": "(contains(City, 'Sydney') or contains(City, 'Baddeck') or contains(City, 'Inverness') or contains(City, 'Cape Breton') or contains(City, 'Glace Bay') or contains(City, 'North Sydney'))",
};

export async function GET(req) {
  // Handle case where req.url might not be available (shouldn't happen in Next.js 13+)
  if (!req || !req.url) {
    return Response.json(
      { error: "Invalid request object", listings: [], total: 0 },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limitParam = searchParams.get("limit") || searchParams.get("$top") || "9";
  const limit = (limitParam === "max" || limitParam === "all") ? 200 : Number(limitParam);
  const city = searchParams.get("city");
  const query = searchParams.get("q") || searchParams.get("query") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minBeds = searchParams.get("minBeds");
  const minBaths = searchParams.get("minBaths");
  const includeSold = searchParams.get("includeSold") === "true";
  const north = searchParams.get("north");
  const south = searchParams.get("south");
  const east = searchParams.get("east");
  const west = searchParams.get("west");

  const skip = (page - 1) * (isNaN(limit) ? 9 : limit);

  // Build OData $filter query
  const filterParts = [
    "PropertyType eq 'Residential'"
  ];
  
  // Include sold properties if requested, otherwise only active
  if (includeSold) {
    // Include both Active and Sold/Closed properties
    filterParts.push("(StandardStatus eq 'Active' or StandardStatus eq 'Sold' or StandardStatus eq 'Closed' or StandardStatus eq 'Pending')");
  } else {
    filterParts.push("StandardStatus eq 'Active'");
  }

  if (city) {
    const areaFilter = AREA_TO_FILTER[city];
    if (areaFilter) {
      filterParts.push(areaFilter);
    } else {
      filterParts.push(`City eq '${city.replace(/'/g, "''")}'`);
    }
  }

  if (minPrice) {
    filterParts.push(`ListPrice ge ${minPrice}`);
  }

  if (maxPrice) {
    filterParts.push(`ListPrice le ${maxPrice}`);
  }

  if (minBeds) {
    filterParts.push(`BedroomsTotal ge ${minBeds}`);
  }

  if (minBaths) {
    filterParts.push(`BathroomsTotalInteger ge ${minBaths}`);
  }

  // Add geographic bounds filter
  if (north && south && east && west) {
    const n = parseFloat(north);
    const s = parseFloat(south);
    const e = parseFloat(east);
    const w = parseFloat(west);
    if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
      filterParts.push(`Latitude ge ${s} and Latitude le ${n} and Longitude ge ${w} and Longitude le ${e}`);
    }
  }

  // Add search query support (search within city if both city and query provided)
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
    const rawLimit = requestedLimit === "all" || requestedLimit === "max" ? 200 : Number(requestedLimit || 40);
    topLimit = Math.min(isNaN(rawLimit) ? 40 : rawLimit, 200); // Sidebar page size
  }

  // Use $count=true to get the full dataset size regardless of $top
  const selectQuery = pinsOnly ? "&$select=ListingId,Latitude,Longitude,ListPrice,StandardStatus,MlsStatus" : "";
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
        StandardStatus: item.StandardStatus || item.Status || "Active",
        MlsStatus: item.MlsStatus || item.Status || "Active",
      };

      if (pinsOnly) return base;

      // Full details for sidebar
      return {
        ...base,
        City: item.City,
        Province: item.Province,
        UnparsedAddress: item.UnparsedAddress,
        BedroomsTotal: item.BedroomsTotal,
        BathroomsTotalInteger: item.BathroomsTotalInteger,
        BuildingAreaTotal: item.BuildingAreaTotal,
        LivingArea: item.LivingArea,
        Status: item.Status || item.StandardStatus || "Active",
        Image:
          item.Media?.[0]?.MediaURL ||
          item.Media?.[0]?.MediaURLThumb ||
          item.Photos?.[0]?.Uri ||
          item.PhotoUrl ||
          null,
      };
    });

    // OData standard: @odata.count contains total count
    const finalTotal = data["@odata.count"] || data["@count"] || data.total || listings.length;

    return Response.json(
      {
        listings,
        total: finalTotal,
        rawData: process.env.NODE_ENV === "development" ? {
          responseKeys: Object.keys(data),
          sampleItem: data.value?.[0] || data.bundle?.[0] || null,
        } : undefined,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    const errorMessage = err.message || "Failed to fetch listings";
    const is404 = errorMessage.includes("404") || errorMessage.includes("Invalid resource");
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403");
    
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Buy API Route Error:", {
        message: errorMessage,
        status: is404 ? 404 : isAuthError ? 401 : 500,
        endpoint: endpoint,
        datasetId: DATASET_ID,
        stack: err.stack,
      });
    }
    
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
