import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 200);
  const type = (searchParams.get("type") || "sale").toLowerCase(); // "sale" | "rent"

  const north = Number(searchParams.get("north"));
  const south = Number(searchParams.get("south"));
  const east = Number(searchParams.get("east"));
  const west = Number(searchParams.get("west"));

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minBeds = searchParams.get("minBeds");
  const minBaths = searchParams.get("minBaths");

  if (![north, south, east, west].every((v) => Number.isFinite(v))) {
    return Response.json(
      { listings: [], total: 0, error: "Missing or invalid bounds." },
      { status: 400 }
    );
  }

  const skip = (page - 1) * limit;

  // Build OData $filter query
  const filterParts = ["PropertyType eq 'Residential'"];

  // Status by type
  if (type === "rent") {
    filterParts.push("StandardStatus eq 'Lease'");
  } else {
    filterParts.push("StandardStatus eq 'Active'");
  }

  // Bounds filter
  filterParts.push(`Latitude ge ${south} and Latitude le ${north}`);
  filterParts.push(`Longitude ge ${west} and Longitude le ${east}`);

  if (minPrice) filterParts.push(`ListPrice ge ${minPrice}`);
  if (maxPrice) filterParts.push(`ListPrice le ${maxPrice}`);
  if (minBeds) filterParts.push(`BedroomsTotal ge ${minBeds}`);
  if (minBaths) filterParts.push(`BathroomsTotalInteger ge ${minBaths}`);

  const filterQuery = filterParts.join(" and ");
  const topLimit = Math.min(limit, 200); // Bridge API max

  // Try Listings first, fallback to Properties
  let endpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;

  try {
    let data;
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        endpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}`;
        data = await bridgeFetch(endpoint);
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

    const total = data["@odata.count"] || data["@count"] || data.total || listings.length;

    return Response.json(
      { listings, total },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    return Response.json(
      { listings: [], total: 0, error: error?.message || "Failed to fetch nearby properties." },
      { status: 500 }
    );
  }
}


