import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 9);
  const city = searchParams.get("city");

  const skip = (page - 1) * limit;

  // Build OData $filter query
  // Using 'eq' for exact matches (more efficient) and 'contains' for partial matches
  const filterParts = [
    "PropertyType eq 'Residential'",
    "StandardStatus eq 'Active'"
  ];

  if (city) {
    // Use 'eq' for exact city match, or 'contains' for partial match
    filterParts.push(`City eq '${city.replace(/'/g, "''")}'`);
  }

  const filterQuery = filterParts.join(" and ");
  
  // Try Listings first, fallback to Properties if needed
  // Use OData syntax: $top, $skip, $filter
  // Note: $expand=Media is not supported, will fetch media separately if needed
  // OData standard response uses 'value' array
  let endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    console.log("🔍 [SELL] Fetching from endpoint:", endpoint);
    let data;
    
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        console.log("⚠️ [SELL] Listings endpoint failed, trying Properties...");
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        data = await bridgeFetch(endpoint);
      } else {
        throw listingsError;
      }
    }
    console.log("✅ [SELL] API Response received:", {
      hasValue: !!data.value,
      hasBundle: !!data.bundle,
      valueLength: data.value?.length || 0,
      bundleLength: data.bundle?.length || 0,
      odataCount: data["@odata.count"],
      keys: Object.keys(data),
    });

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

    return Response.json({
      listings,
      total,
    });
  } catch (err) {
    const errorMessage = err.message || "Failed to fetch listings";
    const is404 = errorMessage.includes("404") || errorMessage.includes("Invalid resource");
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403");
    
    console.error("❌ Sell API Route Error:", {
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

