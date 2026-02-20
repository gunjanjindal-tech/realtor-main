import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 12);
  const query = searchParams.get("q") || searchParams.get("query") || "";
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

  // If there's a search query, add search conditions (case-insensitive)
  // Full address support: "11762 Highway 316 Drumhead" → each word must appear in City or UnparsedAddress
  if (query && query.trim().length > 0) {
    const searchTermLower = query.trim().toLowerCase();
    const words = searchTermLower.split(/\s+/).filter((w) => w.length > 0);

    if (words.length > 0) {
      const wordConditions = words.map((word) => {
        const escaped = word.replace(/'/g, "''");
        return `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}'))`;
      });
      filterParts.push(`(${wordConditions.join(" and ")})`);
    }
  }
  // If no query, return all active residential properties (same as buy API)

  // Add price filters
  if (minPrice) {
    filterParts.push(`ListPrice ge ${minPrice}`);
  }

  if (maxPrice) {
    filterParts.push(`ListPrice le ${maxPrice}`);
  }

  // Add bedroom filter
  if (minBeds) {
    filterParts.push(`BedroomsTotal ge ${minBeds}`);
  }

  // Add bathroom filter
  if (minBaths) {
    filterParts.push(`BathroomsTotalInteger ge ${minBaths}`);
  }

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
      const is404 = listingsError.message.includes("404") || listingsError.message.includes("Invalid resource");
      const is400 = listingsError.message.includes("400") || listingsError.message.includes("Cannot find property");
      
      if (is404 || is400) {
        console.log("⚠️ [SEARCH] Listings endpoint failed, trying Properties...");
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        try {
          data = await bridgeFetch(endpoint);
        } catch (propertiesError) {
          // If Properties also fails, check if it's a field error
          // If so, try with even simpler search (only City and UnparsedAddress)
          if (propertiesError.message.includes("400") || propertiesError.message.includes("Cannot find property")) {
            console.log("⚠️ [SEARCH] Properties endpoint failed with field error, trying simplified search...");
            
            // Try with only City and UnparsedAddress (word-by-word for full address)
            const simpleWords = query.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 0);
            const simpleWordConditions = simpleWords.map((word) => {
              const escaped = word.replace(/'/g, "''");
              return `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}'))`;
            });
            const simpleFilterParts = [
              "PropertyType eq 'Residential'",
              "StandardStatus eq 'Active'",
              ...(simpleWordConditions.length ? [`(${simpleWordConditions.join(" and ")})`] : []),
            ];
            
            // Add other filters (price, beds, baths) if they exist
            if (minPrice) simpleFilterParts.push(`ListPrice ge ${minPrice}`);
            if (maxPrice) simpleFilterParts.push(`ListPrice le ${maxPrice}`);
            if (minBeds) simpleFilterParts.push(`BedroomsTotal ge ${minBeds}`);
            if (minBaths) simpleFilterParts.push(`BathroomsTotalInteger ge ${minBaths}`);
            
            const simpleFilterQuery = simpleFilterParts.join(" and ");
            endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilterQuery)}`;
            
            try {
              data = await bridgeFetch(endpoint);
            } catch (simpleError) {
              // If even simple search fails, throw original error
              throw propertiesError;
            }
          } else {
            throw propertiesError;
          }
        }
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

      // Coordinates for map
      Latitude: item.Latitude || item.LatitudeDecimal,
      Longitude: item.Longitude || item.LongitudeDecimal,

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

    return Response.json(
      {
        listings,
        total,
        query: query.trim(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
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


