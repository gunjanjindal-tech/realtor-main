import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req, { params }) {
  try {
    // Next.js 15+ requires await for params
    const { listingId } = await params;

    if (!listingId) {
      return Response.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Build OData filter to get specific property by ListingId
    const filterQuery = encodeURIComponent(`ListingId eq '${listingId.replace(/'/g, "''")}'`);
    
    let endpoint = `/${DATASET_ID}/Listings?$filter=${filterQuery}&$top=1`;

    console.log("🔍 [PROPERTY] Fetching property:", listingId);

    let data;
    try {
      data = await bridgeFetch(endpoint);
    } catch (listingsError) {
      // If Listings fails with 404, try Properties endpoint
      if (listingsError.message.includes("404") || listingsError.message.includes("Invalid resource")) {
        console.log("⚠️ [PROPERTY] Listings endpoint failed, trying Properties...");
        endpoint = `/${DATASET_ID}/Properties?$filter=${filterQuery}&$top=1`;
        data = await bridgeFetch(endpoint);
      } else {
        throw listingsError;
      }
    }

    const listings = data.value || data.bundle || [];
    
    if (listings.length === 0) {
      return Response.json(
        { error: "Property not found", listing: null },
        { status: 404 }
      );
    }

    const listing = listings[0];

    // Return full listing data
    return Response.json({
      listing: {
        ListingId: listing.ListingId,
        Id: listing.Id,
        ListPrice: listing.ListPrice,
        City: listing.City,
        Province: listing.Province || listing.StateOrProvince,
        UnparsedAddress: listing.UnparsedAddress,
        StreetNumber: listing.StreetNumber,
        StreetName: listing.StreetName,
        PostalCode: listing.PostalCode,
        BedroomsTotal: listing.BedroomsTotal,
        BathroomsTotalInteger: listing.BathroomsTotalInteger,
        BathroomsTotal: listing.BathroomsTotal,
        BuildingAreaTotal: listing.BuildingAreaTotal,
        LivingArea: listing.LivingArea,
        AboveGradeFinishedArea: listing.AboveGradeFinishedArea,
        LotSizeAcres: listing.LotSizeAcres,
        PropertyType: listing.PropertyType,
        PropertySubType: listing.PropertySubType,
        StandardStatus: listing.StandardStatus,
        YearBuilt: listing.YearBuilt,
        Latitude: listing.Latitude || listing.LatitudeDecimal,
        Longitude: listing.Longitude || listing.LongitudeDecimal,
        Description: listing.PublicRemarks || listing.Remarks || listing.LongDescription,
        // Images
        Images: listing.Media?.map(m => m.MediaURL || m.MediaURLThumb).filter(Boolean) || 
                listing.Photos?.map(p => p.PhotoUrl || p.Uri).filter(Boolean) || 
                (listing.PhotoUrl ? [listing.PhotoUrl] : []),
        // Additional fields
        ...listing,
      },
    });
  } catch (err) {
    console.error("❌ Property API Route Error:", err);
    return Response.json(
      { 
        error: err.message || "Failed to fetch property",
        listing: null
      },
      { status: 500 }
    );
  }
}



