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
  // Start with safe fields: City and UnparsedAddress (known to work with tolower)
  // Full address support: "11762 Highway 316 Drumhead" → each word must appear in any searchable field
  if (query && query.trim().length > 0) {
    const searchTermLower = query.trim().toLowerCase();
    const words = searchTermLower.split(/\s+/).filter((w) => w.length > 0);

    if (words.length > 0) {
      const wordConditions = words.map((word) => {
        const escaped = word.replace(/'/g, "''");
        // Use only City and UnparsedAddress - these are known to work with tolower()
        // Other fields (StreetName, PostalCode, Province) may not support tolower()
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
  
  // Bridge API has a maximum $top value of 200
  const topLimit = Math.min(limit, 200);
  
  // Try Listings first, fallback to Properties if needed
  let endpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    // Suppress verbose logging
    // if (process.env.NODE_ENV === "development") {
    //   console.log("🔍 [SEARCH] Fetching from endpoint:", endpoint);
    // }
    let data;
    
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint (expected fallback)
      const is404 = listingsError.message.includes("404") || listingsError.message.includes("Invalid resource");
      const is400 = listingsError.message.includes("400") || listingsError.message.includes("Cannot find property");
      
      if (is404 || is400) {
        // Suppress expected fallback logging
        // if (process.env.NODE_ENV === "development") {
        //   console.log("⚠️ [SEARCH] Listings endpoint failed, trying Properties...");
        // }
        endpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        try {
          data = await bridgeFetch(endpoint);
        } catch (propertiesError) {
          // If Properties also fails, check if it's a field error
          // If so, try with even simpler search (only City and UnparsedAddress)
          if (propertiesError.message.includes("400") || propertiesError.message.includes("Cannot find property")) {
            // Suppress expected fallback logging
            // if (process.env.NODE_ENV === "development") {
            //   console.log("⚠️ [SEARCH] Properties endpoint failed with field error, trying simplified search...");
            // }
            
            // Try with safe fields only (City and UnparsedAddress)
            // Other fields may not support tolower() in Bridge API
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
            endpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilterQuery)}`;
            
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

    // Suppress verbose success logging
    // if (process.env.NODE_ENV === "development") {
    //   console.log("✅ [SEARCH] API Response received:", {
    //     hasValue: !!data.value,
    //     hasBundle: !!data.bundle,
    //     valueLength: data.value?.length || 0,
    //     bundleLength: data.bundle?.length || 0,
    //     odataCount: data["@odata.count"]
    //   });
    // }

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

    // If no results found, try a more relaxed search (OR instead of AND for words)
    if (listings.length === 0 && query && query.trim().length > 0) {
      const searchTermLower = query.trim().toLowerCase();
      const words = searchTermLower.split(/\s+/).filter((w) => w.length > 0);

      if (words.length > 0) {
        // Strategy 1: Try OR search - any word matches any field (more lenient)
        // Use only safe fields: City and UnparsedAddress
        const orConditions = words.map((word) => {
          const escaped = word.replace(/'/g, "''");
          return `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}'))`;
        });
        
        const relaxedFilterParts = [
          "PropertyType eq 'Residential'",
          "StandardStatus eq 'Active'",
          `(${orConditions.join(" or ")})` // Use OR instead of AND
        ];

        // Add other filters if they exist
        if (minPrice) relaxedFilterParts.push(`ListPrice ge ${minPrice}`);
        if (maxPrice) relaxedFilterParts.push(`ListPrice le ${maxPrice}`);
        if (minBeds) relaxedFilterParts.push(`BedroomsTotal ge ${minBeds}`);
        if (minBaths) relaxedFilterParts.push(`BathroomsTotalInteger ge ${minBaths}`);

        const relaxedFilterQuery = relaxedFilterParts.join(" and ");
        let relaxedEndpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(relaxedFilterQuery)}`;

        try {
          let relaxedData;
          try {
            relaxedData = await bridgeFetch(relaxedEndpoint);
          } catch (listingsError) {
            // Try Properties endpoint if Listings fails
            relaxedEndpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(relaxedFilterQuery)}`;
            relaxedData = await bridgeFetch(relaxedEndpoint);
          }
          
          const relaxedListings = (relaxedData.value || relaxedData.bundle || []).map((item) => ({
            ListingId: item.ListingId,
            Id: item.Id,
            ListPrice: item.ListPrice,
            City: item.City,
            Province: item.Province,
            UnparsedAddress: item.UnparsedAddress,
            PostalCode: item.PostalCode,
            BedroomsTotal: item.BedroomsTotal,
            BathroomsTotalInteger: item.BathroomsTotalInteger,
            BuildingAreaTotal: item.BuildingAreaTotal,
            LivingArea: item.LivingArea,
            Latitude: item.Latitude || item.LatitudeDecimal,
            Longitude: item.Longitude || item.LongitudeDecimal,
            Image:
              item.Media?.[0]?.MediaURL ||
              item.Media?.[0]?.MediaURLThumb ||
              item.Photos?.[0]?.Uri ||
              item.PhotoUrl ||
              null,
          }));

          if (relaxedListings.length > 0) {
            return Response.json(
              {
                listings: relaxedListings,
                total: relaxedData["@odata.count"] || relaxedData["@count"] || relaxedListings.length,
                query: query.trim(),
                isRelated: true, // Flag to indicate these are related results
              },
              {
                headers: {
                  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                },
              }
            );
          }
        } catch (relaxedError) {
          // If OR search fails, try Strategy 2: Partial match on first word only
          try {
            const firstWord = words[0];
            const escaped = firstWord.replace(/'/g, "''");
            
            const partialFilterParts = [
              "PropertyType eq 'Residential'",
              "StandardStatus eq 'Active'",
              `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}'))`
            ];

            // Add other filters if they exist
            if (minPrice) partialFilterParts.push(`ListPrice ge ${minPrice}`);
            if (maxPrice) partialFilterParts.push(`ListPrice le ${maxPrice}`);
            if (minBeds) partialFilterParts.push(`BedroomsTotal ge ${minBeds}`);
            if (minBaths) partialFilterParts.push(`BathroomsTotalInteger ge ${minBaths}`);

            const partialFilterQuery = partialFilterParts.join(" and ");
            let partialEndpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(partialFilterQuery)}`;

            let partialData;
            try {
              partialData = await bridgeFetch(partialEndpoint);
            } catch (listingsError) {
              partialEndpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(partialFilterQuery)}`;
              partialData = await bridgeFetch(partialEndpoint);
            }

            const partialListings = (partialData.value || partialData.bundle || []).map((item) => ({
              ListingId: item.ListingId,
              Id: item.Id,
              ListPrice: item.ListPrice,
              City: item.City,
              Province: item.Province,
              UnparsedAddress: item.UnparsedAddress,
              PostalCode: item.PostalCode,
              BedroomsTotal: item.BedroomsTotal,
              BathroomsTotalInteger: item.BathroomsTotalInteger,
              BuildingAreaTotal: item.BuildingAreaTotal,
              LivingArea: item.LivingArea,
              Latitude: item.Latitude || item.LatitudeDecimal,
              Longitude: item.Longitude || item.LongitudeDecimal,
              Image:
                item.Media?.[0]?.MediaURL ||
                item.Media?.[0]?.MediaURLThumb ||
                item.Photos?.[0]?.Uri ||
                item.PhotoUrl ||
                null,
            }));

            if (partialListings.length > 0) {
              return Response.json(
                {
                  listings: partialListings,
                  total: partialData["@odata.count"] || partialData["@count"] || partialListings.length,
                  query: query.trim(),
                  isRelated: true, // Flag to indicate these are related results
                },
                {
                  headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                  },
                }
              );
            }
          } catch (partialError) {
            // If partial search also fails, continue with empty results
            console.warn("Partial search also failed:", partialError);
          }
        }
      }
    }

    return Response.json(
      {
        listings,
        total,
        query: query.trim(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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


