import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

/**
 * Bridge Rent API – rental/lease listings.
 * Uses StandardStatus eq 'Lease' (many MLS). If your dataset has no rental field, returns empty with a message.
 */
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

  // Use only StandardStatus eq 'Lease' – many MLS support this; avoid ListingContractType (often not present)
  const filterParts = [
    "PropertyType eq 'Residential'",
    "StandardStatus eq 'Lease'",
  ];

  if (city) {
    filterParts.push(`contains(tolower(City),'${city.trim().toLowerCase().replace(/'/g, "''")}')`);
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
  let endpoint = `/${DATASET_ID}/Listings?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    console.log("🔍 [RENT] Fetching from endpoint:", endpoint);
    let data;

    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        endpoint = `/${DATASET_ID}/Properties?$top=${limit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        data = await bridgeFetch(endpoint);
      } else if (listingsError.message.includes("400") || listingsError.message.includes("Cannot find property")) {
        // This MLS dataset does not expose rental/lease data – return empty with message (no error)
        console.log("ℹ️ [RENT] This dataset does not support rental filter (StandardStatus eq 'Lease'). Returning empty.");
        return Response.json(
          {
            listings: [],
            total: 0,
            message: "Rental listings are not available in this MLS dataset.",
          },
          {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
          }
        );
      } else {
        throw listingsError;
      }
    }

    const listings = (data.value || data.bundle || []).map((item) => ({
      ListingId: item.ListingId,
      Id: item.Id,
      ListPrice: item.ListPrice,
      City: item.City,
      Province: item.Province,
      UnparsedAddress: item.UnparsedAddress,
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

    const total = data["@odata.count"] || data["@count"] || data.total || listings.length;

    return Response.json(
      { listings, total },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    const errorMessage = err.message || "Failed to fetch rental listings";
    const is404 = errorMessage.includes("404") || errorMessage.includes("Invalid resource");
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403");

    console.error("❌ Rent API Route Error:", {
      message: errorMessage,
      endpoint,
      datasetId: DATASET_ID,
    });

    return Response.json(
      {
        error: errorMessage,
        listings: [],
        total: 0,
        debug:
          process.env.NODE_ENV === "development"
            ? {
                suggestion:
                  "Rental data may use different fields (e.g. ListingContractType, StandardStatus). Check Bridge docs for your dataset.",
              }
            : undefined,
      },
      {
        status: is404 ? 404 : isAuthError ? 401 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
