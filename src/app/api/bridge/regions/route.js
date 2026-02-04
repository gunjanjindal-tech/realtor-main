import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET() {
  try {
    const filterQuery = encodeURIComponent(
      "PropertyType eq 'Residential' and StandardStatus eq 'Active'"
    );
    const data = await bridgeFetch(
      `/${DATASET_ID}/Listings?$top=300&$filter=${filterQuery}`
    );

    const map = {};

    // OData standard uses 'value' array
    (data.value || data.bundle || []).forEach((item) => {
    if (!item.City) return;
      map[item.City] = (map[item.City] || 0) + 1;
    });

    return Response.json(map);
  } catch (err) {
    console.error("❌ Regions API Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
