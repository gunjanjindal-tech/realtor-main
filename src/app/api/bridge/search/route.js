import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limitParam = searchParams.get("limit") || searchParams.get("$top") || "12";
  const limit = (limitParam === "max" || limitParam === "all") ? 200 : Number(limitParam);
  const query = searchParams.get("q") || searchParams.get("query") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minBeds = searchParams.get("minBeds");
  const minBaths = searchParams.get("minBaths");
  const north = searchParams.get("north");
  const south = searchParams.get("south");
  const east = searchParams.get("east");
  const west = searchParams.get("west");

  const skip = (page - 1) * (isNaN(limit) ? 12 : limit);

  // Build OData $filter query
  const filterParts = [
    "PropertyType eq 'Residential'",
    "StandardStatus eq 'Active'"
  ];

  // If there's a search query, add search conditions (case-insensitive)
  // Enhanced street name search: supports StreetName, City, and UnparsedAddress
  // Handles street suffixes (Street/St, Road/Rd, Avenue/Ave, etc.)
  if (query && query.trim().length > 0) {
    const searchTermLower = query.trim().toLowerCase();
    const words = searchTermLower.split(/\s+/).filter((w) => w.length > 0);

    if (words.length > 0) {
      // Normalize street suffixes for better matching
      // e.g., "Street" -> "St", "Road" -> "Rd", "Avenue" -> "Ave"
      const streetSuffixMap = {
        'street': 'st',
        'road': 'rd',
        'avenue': 'ave',
        'drive': 'dr',
        'boulevard': 'blvd',
        'lane': 'ln',
        'court': 'ct',
        'circle': 'cir',
        'place': 'pl',
        'way': 'way',
        'terrace': 'ter',
        'parkway': 'pkwy',
        'highway': 'hwy',
      };

      // Create word variations (original + normalized suffix)
      const wordVariations = words.map(word => {
        const variations = [word];
        // Check if word is a street suffix and add abbreviation
        if (streetSuffixMap[word]) {
          variations.push(streetSuffixMap[word]);
        }
        // Also check reverse - if word is abbreviation, add full form
        const fullForm = Object.keys(streetSuffixMap).find(key => streetSuffixMap[key] === word);
        if (fullForm) {
          variations.push(fullForm);
        }
        return variations;
      });

      // Build search conditions - prioritize exact address matches
      // Strategy: First try exact match, then phrase/AND logic, then a flexible OR fallback.
      const escapedQuery = searchTermLower.replace(/'/g, "''");

      // Priority 1: Try exact match on UnparsedAddress first (most accurate)
      // This ensures "9 Karen Court, Cambridge NS BON 2R0" finds that exact property
      const exactMatchCondition = `tolower(UnparsedAddress) eq '${escapedQuery}'`;

      // Priority 2: Try partial exact match (contains full query in UnparsedAddress)
      const partialExactMatch = `contains(tolower(UnparsedAddress),'${escapedQuery}')`;

      // Priority 3: Build word-based conditions.  Special-case street suffixes
      // (way, st, rd, etc.) so they only match the StreetName field, and use
      // AND logic whenever a suffix is present or the query has two or more
      // words to avoid overly broad hits (e.g. "alabaster way" matching any
      // listing containing "way", like highways).
      const streetSuffixes = new Set(Object.keys(streetSuffixMap));

      const wordConditions = words.map((word) => {
        const escaped = word.replace(/'/g, "''");
        const isSuffix = streetSuffixes.has(word);

        if (isSuffix) {
          // suffix-only search limited to street name
          return `(StreetName ne null and contains(tolower(StreetName),'${escaped}'))`;
        }

        // normal word: search across city, address, or street name
        return `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}') or (StreetName ne null and contains(tolower(StreetName),'${escaped}'))) `;
      });

      // Decide whether to combine words with OR or AND.  Use OR only when the
      // query is a single term and there are no suffix words; otherwise require
      // all terms to match (AND).
      const useOrLogic = words.length === 1 && !words.some(w => streetSuffixes.has(w));
      const wordLogic = useOrLogic
        ? wordConditions.join(" or ")
        : wordConditions.join(" and ");

      // Combine: exact match OR partial exact match OR word matching (OR/AND based on word count)
      // This ensures exact addresses are found first, then flexible partial matches
      const searchCondition = `(${exactMatchCondition} or ${partialExactMatch} or (${wordLogic}))`;

      filterParts.push(searchCondition);
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

  // Add geographic bounds filter
  if (north && south && east && west) {
    const n = parseFloat(north);
    const s = parseFloat(south);
    const e = parseFloat(east);
    const w = parseFloat(west);
    if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
      filterParts.push(`Latitude ge ${s} and Latitude le ${n} and Longitude ge ${w} and Longitude le ${e}`);
    }
  }

  const filterQuery = filterParts.join(" and ");

  // Zillow-style Architecture:
  // 1. countOnly=true -> Return only the total count (uses $top=0 for speed)
  // 2. pinsOnly=true -> Return only minimal data for many properties (up to 5000) for map clustering
  // 3. Standard -> Return a detailed set of listings for the sidebar (typically 40 per page)
  const countOnly = searchParams.get("countOnly") === "true";
  const pinsOnly = searchParams.get("pinsOnly") === "true";
  
  const requestedLimit = searchParams.get("limit") || searchParams.get("$top");
  let topLimit;
  
  if (countOnly) {
    topLimit = 0;
  } else if (pinsOnly) {
    topLimit = 200; // MUST cap at 200 per request to avoid API error
  } else {
    topLimit = Math.min(Number(requestedLimit || 40), 200); // Sidebar page size
  }

  // Use $count=true to get the full dataset size regardless of $top
  // For pinsOnly, we can use $select to minimize bandwidth
  const selectQuery = pinsOnly ? "&$select=ListingId,Latitude,Longitude,ListPrice,StandardStatus,MlsStatus" : "";
  let endpoint = `/${DATASET_ID}/Listings?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;

  try {
    let data;
    let pinsData = [];
    
    // For pinsOnly, we fetch multiple pages in parallel to get up to 1000 results
    // while strictly respecting the 200-item per-request limit.
    if (pinsOnly) {
      const pageOffsets = [0, 200, 400, 600, 800]; // 5 pages of 200 = 1000 results
      const fetchPromises = pageOffsets.map(offset => {
        const pEndpoint = `/${DATASET_ID}/Listings?$top=200&$skip=${skip + offset}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;
        return bridgeFetch(pEndpoint).catch(async (err) => {
          // Fallback to Properties for each page if Listings fails
          const is404 = err.message.includes("404") || err.message.includes("Invalid resource");
          const is400 = err.message.includes("400") || err.message.includes("Cannot find property");
          if (is404 || is400) {
            const propEndpoint = `/${DATASET_ID}/Properties?$top=200&$skip=${skip + offset}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;
            return bridgeFetch(propEndpoint);
          }
          throw err;
        });
      });

      const results = await Promise.all(fetchPromises);
      data = results[0]; // Use first page for metadata (total count)
      pinsData = results.flatMap(r => r.value || r.bundle || []);
    } else {
      try {
        data = await bridgeFetch(endpoint);
      } catch (listingsError) {
        const is404 = listingsError.message.includes("404") || listingsError.message.includes("Invalid resource");
        const is400 = listingsError.message.includes("400") || listingsError.message.includes("Cannot find property");

        if (is404 || is400) {
          endpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(filterQuery)}&$count=true${selectQuery}`;
          data = await bridgeFetch(endpoint);
        } else {
          throw listingsError;
        }
      }
    }

    const total = Number(data["@odata.count"] || data["@count"] || data.total || 0);

    // If countOnly was requested, return immediately
    if (countOnly) {
      return Response.json({ total, listings: [] });
    }

    const listingsFromAllPages = pinsOnly ? pinsData : (data.value || data.bundle || []);
    const listings = listingsFromAllPages.map((item) => {
      // Common fields
      const base = {
        ListingId: item.ListingId,
        Id: item.Id,
        ListPrice: item.ListPrice,
        Latitude: item.Latitude || item.LatitudeDecimal,
        Longitude: item.Longitude || item.LongitudeDecimal,
        StandardStatus: item.StandardStatus,
        MlsStatus: item.MlsStatus,
      };

      if (pinsOnly) return base;

      // Full details for sidebar
      return {
        ...base,
        City: item.City,
        Province: item.Province,
        UnparsedAddress: item.UnparsedAddress,
        StreetName: item.StreetName,
        StreetNumber: item.StreetNumber,
        PostalCode: item.PostalCode,
        BedroomsTotal: item.BedroomsTotal,
        BathroomsTotalInteger: item.BathroomsTotalInteger,
        BuildingAreaTotal: item.BuildingAreaTotal,
        LivingArea: item.LivingArea,
        YearBuilt: item.YearBuilt,
        PropertySubType: item.PropertySubType,
        PropertyType: item.PropertyType,
        Image:
          item.Media?.[0]?.MediaURL ||
          item.Media?.[0]?.MediaURLThumb ||
          item.Photos?.[0]?.Uri ||
          item.PhotoUrl ||
          null,
      };
    });

    // OData standard: @odata.count contains total count
    const finalTotal = data["@odata.count"] || data["@count"] || data.total || listings.length;

    // If no results found, try a more relaxed search (OR instead of AND for words)
    if (listings.length === 0 && query && query.trim().length > 0) {
      const searchTermLower = query.trim().toLowerCase();
      const words = searchTermLower.split(/\s+/).filter((w) => w.length > 0);

      if (words.length > 0) {
        // Strategy 1: Try exact match first, then OR search - any word matches any field (more lenient)
        // Use safe fields (tolower with City, UnparsedAddress, and StreetName)
        const relaxedEscapedQuery = searchTermLower.replace(/'/g, "''");

        // Try exact match on UnparsedAddress first
        const relaxedExactMatch = `tolower(UnparsedAddress) eq '${relaxedEscapedQuery}'`;
        const relaxedPartialExact = `contains(tolower(UnparsedAddress),'${relaxedEscapedQuery}')`;

        const orConditions = words.map((word) => {
          const escaped = word.replace(/'/g, "''");
          // Use tolower() - safe and works with Bridge API
          // Search in City, UnparsedAddress, and StreetName for better results
          // Handle null StreetName by using OR with null check
          return `(contains(tolower(City),'${escaped}') or contains(tolower(UnparsedAddress),'${escaped}') or (StreetName ne null and contains(tolower(StreetName),'${escaped}')))`;
        });

        // For single word, use the condition directly (already searches all fields with OR)
        // For multiple words, use OR logic (any word can match)
        const relaxedWordLogic = words.length === 1
          ? orConditions[0]  // Single word: condition itself (already searches all fields)
          : orConditions.join(" or ");  // Multiple words: OR logic (any word matches)

        const relaxedFilterParts = [
          "PropertyType eq 'Residential'",
          "StandardStatus eq 'Active'",
          `(${relaxedExactMatch} or ${relaxedPartialExact} or (${relaxedWordLogic}))` // Exact match OR partial OR word matching
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
            // Check if it's a network error - don't try fallback
            const isNetworkError = listingsError.message.includes("network error") ||
              listingsError.message.includes("timeout") ||
              listingsError.message.includes("fetch failed");

            if (isNetworkError) {
              throw listingsError; // Don't try fallback for network errors
            }

            // Try Properties endpoint if Listings fails (only for 404/400)
            const is404 = listingsError.message.includes("404") || listingsError.message.includes("Invalid resource");
            const is400 = listingsError.message.includes("400") || listingsError.message.includes("Cannot find property");

            if (is404 || is400) {
              relaxedEndpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(relaxedFilterQuery)}`;
              relaxedData = await bridgeFetch(relaxedEndpoint);
            } else {
              throw listingsError;
            }
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
            YearBuilt: item.YearBuilt,
            PropertySubType: item.PropertySubType,
            PropertyType: item.PropertyType,
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
              // Check if it's a network error - don't try fallback
              const isNetworkError = listingsError.message.includes("network error") ||
                listingsError.message.includes("timeout") ||
                listingsError.message.includes("fetch failed");

              if (isNetworkError) {
                throw listingsError; // Don't try fallback for network errors
              }

              // Try Properties endpoint if Listings fails (only for 404/400)
              const is404 = listingsError.message.includes("404") || listingsError.message.includes("Invalid resource");
              const is400 = listingsError.message.includes("400") || listingsError.message.includes("Cannot find property");

              if (is404 || is400) {
                partialEndpoint = `/${DATASET_ID}/Properties?$top=${topLimit}&$skip=${skip}&$filter=${encodeURIComponent(partialFilterQuery)}`;
                partialData = await bridgeFetch(partialEndpoint);
              } else {
                throw listingsError;
              }
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
              YearBuilt: item.YearBuilt,
              PropertySubType: item.PropertySubType,
              PropertyType: item.PropertyType,
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
        total: finalTotal,
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
    const isNetworkError = errorMessage.includes("network error") || errorMessage.includes("timeout") || errorMessage.includes("fetch failed");

    if (process.env.NODE_ENV === "development") {
      console.error("❌ Search API Route Error:", {
        message: errorMessage,
        status: is404 ? 404 : isAuthError ? 401 : (isNetworkError ? 503 : 500),
        endpoint: endpoint,
        query: query,
        datasetId: DATASET_ID,
      });
    }

    // Always return JSON, even on error
    // Use 503 for network errors (service unavailable)
    return Response.json(
      {
        error: isNetworkError
          ? "Bridge API is temporarily unavailable. Please try again later."
          : errorMessage,
        listings: [],
        total: 0,
        query: query.trim(),
      },
      {
        status: is404 ? 404 : isAuthError ? 401 : (isNetworkError ? 503 : 500),
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}


