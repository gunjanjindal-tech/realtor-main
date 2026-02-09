import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

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

  if (city) {
    filterParts.push(`City eq '${city.replace(/'/g, "''")}'`);
  }

  const filterQuery = filterParts.join(" and ");
  
  // Try Listings first, fallback to Properties if needed
  let endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    console.log("🔍 [NEW-DEV] Fetching from endpoint:", endpoint);
    let data;
    
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        console.log("⚠️ [NEW-DEV] Listings endpoint failed, trying Properties...");
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        data = await bridgeFetch(endpoint);
      } else if (listingsError.message.includes("400") || listingsError.message.includes("Bad Request")) {
        // If filter fails (e.g., YearBuilt field not available), try simpler filter
        console.log("⚠️ [NEW-DEV] YearBuilt filter failed, trying simpler filter...");
        const simpleFilterParts = [
          "PropertyType eq 'Residential'",
          "StandardStatus eq 'Active'"
        ];
        if (city) {
          simpleFilterParts.push(`City eq '${city.replace(/'/g, "''")}'`);
        }
        const simpleFilter = simpleFilterParts.join(" and ");
        endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}`;
        
        try {
          data = await bridgeFetch(endpoint);
        } catch (simpleError) {
          // Try Properties endpoint with simple filter
          if (simpleError.message.includes("404") || simpleError.message.includes("Invalid resource")) {
            endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}`;
            data = await bridgeFetch(endpoint);
          } else {
            throw simpleError;
          }
        }
      } else {
        throw listingsError;
      }
    }

    console.log("✅ [NEW-DEV] API Response received:", {
      hasValue: !!data.value,
      hasBundle: !!data.bundle,
      valueLength: data.value?.length || 0,
      bundleLength: data.bundle?.length || 0,
      odataCount: data["@odata.count"],
      keys: Object.keys(data),
    });

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

    return Response.json({
      listings,
      total,
    });
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

