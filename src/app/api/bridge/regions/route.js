import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET() {
  try {
    const filterQuery = encodeURIComponent(
      "PropertyType eq 'Residential' and StandardStatus eq 'Active'"
    );
    
    // Bridge API maximum $top is 200
    const maxTop = 200;
    let endpoint = `/${DATASET_ID}/Listings?$top=${maxTop}&$filter=${filterQuery}`;
    let data;
    const map = {};

    try {
      console.log("🔍 Regions: Fetching from endpoint:", endpoint);
      data = await bridgeFetch(endpoint);
      
      // Process first batch
      (data.value || data.bundle || []).forEach((item) => {
        if (!item.City) return;
        map[item.City] = (map[item.City] || 0) + 1;
      });

      // If there are more results, fetch them using pagination
      let totalCount = data["@odata.count"] || 0;
      let fetched = (data.value || data.bundle || []).length;
      let skip = maxTop;

      while (fetched < totalCount && skip < 1000) { // Limit to 1000 total to avoid too many requests
        endpoint = `/${DATASET_ID}/Listings?$top=${maxTop}&$skip=${skip}&$filter=${filterQuery}`;
        try {
          const nextData = await bridgeFetch(endpoint);
          (nextData.value || nextData.bundle || []).forEach((item) => {
            if (!item.City) return;
            map[item.City] = (map[item.City] || 0) + 1;
          });
          fetched += (nextData.value || nextData.bundle || []).length;
          skip += maxTop;
        } catch (err) {
          console.warn("⚠️ Regions: Failed to fetch next page:", err.message);
          break;
        }
      }
    } catch (listingsError) {
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        console.log("⚠️ Regions: Listings endpoint failed, trying Properties...");
        endpoint = `/${DATASET_ID}/Properties?$top=${maxTop}&$filter=${filterQuery}`;
        try {
          data = await bridgeFetch(endpoint);
          (data.value || data.bundle || []).forEach((item) => {
            if (!item.City) return;
            map[item.City] = (map[item.City] || 0) + 1;
          });
        } catch (propertiesError) {
          throw propertiesError;
        }
      } else {
        throw listingsError;
      }
    }

    return Response.json(map, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("❌ Regions API Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
