import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET() {
  try {
    // Build filter for new developments (properties built in last 5 years)
    const currentYear = new Date().getFullYear();
    const fiveYearsAgo = currentYear - 5;
    
    const filterParts = [
      "PropertyType eq 'Residential'",
      "StandardStatus eq 'Active'",
      `YearBuilt ge ${fiveYearsAgo}`
    ];

    const filterQuery = filterParts.join(" and ");
    // Bridge API maximum $top is 200
    const maxTop = 200;
    let endpoint = `/${DATASET_ID}/Listings?$top=${maxTop}&$filter=${encodeURIComponent(filterQuery)}`;
    const counts = {};

    try {
      console.log("🔍 [NEW-DEV-COUNTS] Fetching from endpoint:", endpoint);
      let data = await bridgeFetch(endpoint);
      
      // Process first batch
      (data.value || data.bundle || []).forEach((item) => {
        if (!item.City) return;
        counts[item.City] = (counts[item.City] || 0) + 1;
      });

      // Fetch more if needed (pagination)
      let totalCount = data["@odata.count"] || 0;
      let fetched = (data.value || data.bundle || []).length;
      let skip = maxTop;

      while (fetched < totalCount && skip < 1000) {
        endpoint = `/${DATASET_ID}/Listings?$top=${maxTop}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        try {
          const nextData = await bridgeFetch(endpoint);
          (nextData.value || nextData.bundle || []).forEach((item) => {
            if (!item.City) return;
            counts[item.City] = (counts[item.City] || 0) + 1;
          });
          fetched += (nextData.value || nextData.bundle || []).length;
          skip += maxTop;
        } catch (err) {
          console.warn("⚠️ [NEW-DEV-COUNTS] Failed to fetch next page:", err.message);
          break;
        }
      }

      console.log("✅ [NEW-DEV-COUNTS] Counts calculated:", counts);
      return Response.json(counts);
    } catch (listingsError) {
      // If Listings fails or YearBuilt filter fails, try Properties endpoint
      if (listingsError.message.includes("404") || 
          listingsError.message.includes("Invalid resource") ||
          listingsError.message.includes("400") ||
          listingsError.message.includes("Cannot find property") ||
          listingsError.message.includes("Bad Request") ||
          listingsError.message.includes("Maximum value")) {
        console.log("⚠️ [NEW-DEV-COUNTS] YearBuilt filter failed, trying without it...");
        
        // Try without YearBuilt filter (just active residential)
        const simpleFilterParts = [
          "PropertyType eq 'Residential'",
          "StandardStatus eq 'Active'"
        ];
        const simpleFilter = simpleFilterParts.join(" and ");
        endpoint = `/${DATASET_ID}/Listings?$top=${maxTop}&$filter=${encodeURIComponent(simpleFilter)}`;
        
        try {
          let data = await bridgeFetch(endpoint);
          (data.value || data.bundle || []).forEach((item) => {
            if (!item.City) return;
            counts[item.City] = (counts[item.City] || 0) + 1;
          });
          
          // Pagination for simple filter too
          let totalCount = data["@odata.count"] || 0;
          let fetched = (data.value || data.bundle || []).length;
          let skip = maxTop;
          while (fetched < totalCount && skip < 1000) {
            endpoint = `/${DATASET_ID}/Listings?$top=${maxTop}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}`;
            try {
              const nextData = await bridgeFetch(endpoint);
              (nextData.value || nextData.bundle || []).forEach((item) => {
                if (!item.City) return;
                counts[item.City] = (counts[item.City] || 0) + 1;
              });
              fetched += (nextData.value || nextData.bundle || []).length;
              skip += maxTop;
            } catch (err) {
              break;
            }
          }
          
          console.log("✅ [NEW-DEV-COUNTS] Counts calculated (without YearBuilt):", counts);
          return Response.json(counts);
        } catch (listingsSimpleError) {
          // Try Properties endpoint
          if (listingsSimpleError.message.includes("404") || listingsSimpleError.message.includes("Invalid resource")) {
            console.log("⚠️ [NEW-DEV-COUNTS] Listings failed, trying Properties...");
            endpoint = `/${DATASET_ID}/Properties?$top=${maxTop}&$filter=${encodeURIComponent(simpleFilter)}`;
            let data = await bridgeFetch(endpoint);
            (data.value || data.bundle || []).forEach((item) => {
              if (!item.City) return;
              counts[item.City] = (counts[item.City] || 0) + 1;
            });
            
            // Pagination for Properties too
            let totalCount = data["@odata.count"] || 0;
            let fetched = (data.value || data.bundle || []).length;
            let skip = maxTop;
            while (fetched < totalCount && skip < 1000) {
              endpoint = `/${DATASET_ID}/Properties?$top=${maxTop}&$skip=${skip}&$filter=${encodeURIComponent(simpleFilter)}`;
              try {
                const nextData = await bridgeFetch(endpoint);
                (nextData.value || nextData.bundle || []).forEach((item) => {
                  if (!item.City) return;
                  counts[item.City] = (counts[item.City] || 0) + 1;
                });
                fetched += (nextData.value || nextData.bundle || []).length;
                skip += maxTop;
              } catch (err) {
                break;
              }
            }
            
            console.log("✅ [NEW-DEV-COUNTS] Counts calculated (Properties endpoint):", counts);
            return Response.json(counts);
          } else {
            throw listingsSimpleError;
          }
        }
      } else {
        throw listingsError;
      }
    }
  } catch (err) {
    console.error("❌ New Development Counts API Error:", err);
    return Response.json({}, { status: 500 });
  }
}

