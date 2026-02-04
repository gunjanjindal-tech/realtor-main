import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 12);
  const query = searchParams.get("q") || searchParams.get("query") || "";

  if (!query || query.trim().length === 0) {
    return Response.json({
      listings: [],
      total: 0,
      error: "Search query is required",
    }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  // Build OData $filter query for search
  // Search in multiple fields: City, UnparsedAddress, ListingId, etc.
  const searchTerm = query.trim().replace(/'/g, "''");
  const filterParts = [
    "PropertyType eq 'Residential'",
    "StandardStatus eq 'Active'",
    `(contains(City,'${searchTerm}') or contains(UnparsedAddress,'${searchTerm}') or contains(ListingId,'${searchTerm}') or contains(PostalCode,'${searchTerm}'))`
  ];

  const filterQuery = filterParts.join(" and ");
  
  // Try Listings first, fallback to Properties if needed
  let endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    console.log("🔍 [SEARCH] Fetching from endpoint:", endpoint);
    let data;
    
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        console.log("⚠️ [SEARCH] Listings endpoint failed, trying Properties...");
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        data = await bridgeFetch(endpoint);
      } else {
        throw listingsError;
      }
    }

    console.log("✅ [SEARCH] API Response received:", {
      hasValue: !!data.value,
      hasBundle: !!data.bundle,
      valueLength: data.value?.length || 0,
      bundleLength: data.bundle?.length || 0,
      odataCount: data["@odata.count"],
    });

    // OData standard uses 'value' array, but some APIs use 'bundle'
    const listings = (data.value || data.bundle || []).map((item) => ({
      ListingId: item.ListingId,
      Id: item.Id,

      ListPrice: item.ListPrice,
      City: item.City,
      Province: item.Province,
      UnparsedAddress: item.UnparsedAddress,
      PostalCode: item.PostalCode,

      BedroomsTotal: item.BedroomsTotal,
      BathroomsTotalInteger: item.BathroomsTotalInteger,

      // SQ FT
      BuildingAreaTotal: item.BuildingAreaTotal,
      LivingArea: item.LivingArea,

      // Image
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
      query: query.trim(),
    });
  } catch (err) {
    const errorMessage = err.message || "Failed to search listings";
    const is404 = errorMessage.includes("404") || errorMessage.includes("Invalid resource");
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403");
    
    console.error("❌ Search API Route Error:", {
      message: errorMessage,
      status: is404 ? 404 : isAuthError ? 401 : 500,
      endpoint: endpoint,
      query: query,
      datasetId: DATASET_ID,
    });
    
    // Always return JSON, even on error
    return Response.json(
      { 
        error: errorMessage,
        listings: [],
        total: 0,
        query: query.trim(),
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

