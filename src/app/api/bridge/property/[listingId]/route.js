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

    // Try to fetch property/sale history from separate Bridge resource (ListingHistory / PropertyHistory)
    // Many MLS expose history only via a separate resource; filter by ListingKey or ListingId.
    let historyFromApi = [];
    const listingKey = listing.ListingKey ?? listing.ListingId ?? listing.Id ?? listingId;
    const keyStr = String(listingKey).replace(/'/g, "''");
    const historyFilters = [
      `ListingId eq '${keyStr}'`,
      `ListingKey eq '${keyStr}'`,
      `ListingKey eq '${listing.ListingKey || listingKey}'`,
    ];
    const historyResources = ["ListingHistory", "PropertyHistory", "ListingHistories", "PropertyHistories", "History"];
    resourceLoop: for (const resource of historyResources) {
      for (const filter of historyFilters) {
        try {
          const histEndpoint = `/${DATASET_ID}/${resource}?$filter=${encodeURIComponent(filter)}&$top=50&$orderby=CloseDate desc`;
          const histData = await bridgeFetch(histEndpoint);
          const rows = histData.value ?? histData.bundle ?? histData.results ?? [];
          if (Array.isArray(rows) && rows.length > 0) {
            historyFromApi = rows.map((r) => ({
              ClosePrice: r.ClosePrice ?? r.closePrice ?? r.CloseAmount ?? r.SoldPrice,
              CloseDate: r.CloseDate ?? r.closeDate ?? r.EventDate ?? r.ClosingDate,
              EventType: r.EventType ?? r.EventDescription ?? r.Type ?? "Sale",
              ListPrice: r.ListPrice ?? r.ListPriceClose,
            })).filter((r) => r.ClosePrice != null || r.CloseDate != null);
            if (historyFromApi.length > 0) {
              console.log("✅ [PROPERTY] History from", resource, ":", historyFromApi.length, "rows");
              break resourceLoop;
            }
          }
        } catch (e) {
          if (!e.message?.includes("404") && !e.message?.includes("Invalid resource")) {
            console.log("ℹ️ [PROPERTY] No history from", resource, ":", e.message?.slice(0, 60));
          }
        }
      }
    }

    // Normalize features that may be string (comma-separated) or array
    const toList = (v) => {
      if (v == null || v === "") return [];
      if (Array.isArray(v)) return v.filter(Boolean).map(String).map((s) => s.trim()).filter(Boolean);
      return String(v).split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    };

    // Sale/price history: from listing fields (when MLS embeds them) or from History resource above
    const saleHistory = [];
    if (listing.ClosePrice != null || listing.closePrice != null) {
      saleHistory.push({
        label: "Last sale price",
        value: listing.ClosePrice ?? listing.closePrice,
      });
    }
    if (listing.CloseDate != null || listing.closeDate != null) {
      saleHistory.push({
        label: "Last sale date",
        value: listing.CloseDate ?? listing.closeDate,
      });
    }
    if (listing.PreviousClosePrice != null || listing.previousClosePrice != null) {
      saleHistory.push({
        label: "Previous close price",
        value: listing.PreviousClosePrice ?? listing.previousClosePrice,
      });
    }
    // List price is shown in Financials; don't add to sale history table
    // History: from listing embed, or from separate ListingHistory/PropertyHistory API
    const historyArrayRaw = listing.History ?? listing.PropertyHistory ?? listing.ListingHistory ?? listing.SalesHistory ?? [];
    const historyArray = historyFromApi.length > 0
      ? historyFromApi
      : (Array.isArray(historyArrayRaw) ? historyArrayRaw : []);

    // Build normalized feature arrays (override raw API values)
    const interiorFeatures = toList(listing.InteriorFeatures ?? listing.interiorFeatures ?? listing.InteriorFeaturesList);
    const exteriorFeatures = toList(listing.ExteriorFeatures ?? listing.exteriorFeatures ?? listing.ExteriorFeaturesList);
    const appliances = toList(listing.Appliances ?? listing.appliances);
    const fireplaceFeatures = toList(listing.FireplaceFeatures ?? listing.fireplaceFeatures);
    const communityFeatures = toList(listing.CommunityFeatures ?? listing.communityFeatures);
    const lotFeatures = toList(listing.LotFeatures ?? listing.lotFeatures);
    const amenities = [
      ...interiorFeatures,
      ...exteriorFeatures,
      ...appliances,
      ...fireplaceFeatures,
      ...communityFeatures,
      ...lotFeatures,
    ].filter(Boolean);

    const listingOut = {
      ...listing,
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
      LotSizeSquareFeet: listing.LotSizeSquareFeet,
      PropertyType: listing.PropertyType,
      PropertySubType: listing.PropertySubType,
      StandardStatus: listing.StandardStatus,
      YearBuilt: listing.YearBuilt,
      Latitude: listing.Latitude || listing.LatitudeDecimal,
      Longitude: listing.Longitude || listing.LongitudeDecimal,
      Description: listing.PublicRemarks || listing.Remarks || listing.LongDescription,
      Images: listing.Media?.map(m => m.MediaURL || m.MediaURLThumb).filter(Boolean) ||
              listing.Photos?.map(p => p.PhotoUrl || p.Uri).filter(Boolean) ||
              (listing.PhotoUrl ? [listing.PhotoUrl] : []),
      InteriorFeatures: interiorFeatures,
      ExteriorFeatures: exteriorFeatures,
      Appliances: appliances,
      FireplaceFeatures: fireplaceFeatures,
      CommunityFeatures: communityFeatures,
      LotFeatures: lotFeatures,
      Amenities: amenities,
      SaleHistory: saleHistory,
      History: Array.isArray(historyArray) ? historyArray : [],
      ClosePrice: listing.ClosePrice ?? listing.closePrice,
      CloseDate: listing.CloseDate ?? listing.closeDate,
      PreviousClosePrice: listing.PreviousClosePrice ?? listing.previousClosePrice,
    };

    return Response.json({ listing: listingOut });
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



