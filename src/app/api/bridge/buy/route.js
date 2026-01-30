import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 9);
  const city = searchParams.get("city");

  const offset = (page - 1) * limit;

  let endpoint = `/${DATASET_ID}/listings?limit=${limit}&offset=${offset}&PropertyType=Residential&StandardStatus=Active`;

  if (city) {
    endpoint += `&City=${encodeURIComponent(city)}`;
  }

  try {
    const data = await bridgeFetch(endpoint);

    // 🔥 SANITIZE RESPONSE (VERY IMPORTANT)
    const listings = (data.bundle || []).map((item) => ({
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

      // Image
      Image:
        item.Media?.[0]?.MediaURL ||
        item.Media?.[0]?.MediaURLThumb ||
        null,
    }));

    return Response.json({
      listings,
      total: data.total || 0,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
