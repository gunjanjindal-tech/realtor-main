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
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 9);
  const city = searchParams.get("city");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minBeds = searchParams.get("minBeds");
  const minBaths = searchParams.get("minBaths");

  const skip = (page - 1) * limit;

  // Build OData $filter query
  const filterParts = [
    "PropertyType eq 'Residential'",
    "StandardStatus eq 'Active'"
  ];

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

  const filterQuery = filterParts.join(" and ");
  
  // Try Listings first, fallback to Properties if needed
  // Use OData syntax: $top, $skip, $filter
  // Note: $expand=Media is not supported, will fetch media separately if needed
  // OData standard response uses 'value' array, not 'bundle'
  let endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Fetching from endpoint:", endpoint);
    }
    let data;
    
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Listings endpoint failed, trying Properties...");
        }
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        data = await bridgeFetch(endpoint);
      } else {
        throw listingsError;
      }
    }
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API Response received:", {
        hasValue: !!data.value,
        hasBundle: !!data.bundle,
        valueLength: data.value?.length || 0,
        bundleLength: data.bundle?.length || 0,
        odataCount: data["@odata.count"],
        keys: Object.keys(data),
      });
    }

    // OData standard uses 'value' array, but some APIs use 'bundle'
    // 🔥 SANITIZE RESPONSE (VERY IMPORTANT)
    const listings = (data.value || data.bundle || []).map((item) => ({
      ListingId: item.ListingId,
      Id: item.Id,

      ListPrice: item.ListPrice,
      City: item.City,
      Province: item.Province,
      UnparsedAddress: item.UnparsedAddress,

      BedroomsTotal: item.BedroomsTotal,
      BathroomsTotalInteger: item.BathroomsTotalInteger,

      // SQ FT
      BuildingAreaTotal: item.BuildingAreaTotal,
      LivingArea: item.LivingArea,

      // Coordinates for map
      Latitude: item.Latitude || item.LatitudeDecimal,
      Longitude: item.Longitude || item.LongitudeDecimal,

      // Image - Media might be in different fields or need separate API call
      Image:
        item.Media?.[0]?.MediaURL ||
        item.Media?.[0]?.MediaURLThumb ||
        item.Photos?.[0]?.Uri ||
        item.PhotoUrl ||
        null,
    }));

    // OData standard: @odata.count contains total count
    const total = data["@odata.count"] || data["@count"] || data.total || listings.length;

    return Response.json(
      {
        listings,
        total,
        rawData: process.env.NODE_ENV === "development" ? {
          responseKeys: Object.keys(data),
          sampleItem: data.value?.[0] || data.bundle?.[0] || null,
        } : undefined,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
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
