import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

/**
 * Test endpoint to debug API connection
 * Visit: /api/bridge/test
 */
export async function GET() {
  try {
    // Test 1: Check datasets to see available datasets
    console.log("🧪 Test 1: Fetching datasets...");
    let datasets;
    try {
      datasets = await bridgeFetch("/datasets?");
    } catch (err) {
      return Response.json({
        success: false,
        error: `Failed to fetch datasets: ${err.message}`,
        suggestion: "Check if BRIDGE_SERVER_TOKEN is correct and API base URL is accessible"
      }, { status: 500 });
    }
    
    // Extract available dataset IDs
    const availableDatasets = datasets.value || datasets.bundle || [];
    const datasetIds = availableDatasets.map(d => d.Id || d.id || d.DatasetId).filter(Boolean);
    
    // Test 2: Check listings with minimal params (try both Listings and Properties)
    console.log("🧪 Test 2: Testing Listings endpoint...");
    let listings, listingsError;
    try {
      listings = await bridgeFetch(`/${DATASET_ID}/Listings?$top=5`);
    } catch (err) {
      listingsError = err.message;
      console.log("⚠️ Listings endpoint failed:", err.message);
    }
    
    // Test 3: Try Properties endpoint
    console.log("🧪 Test 3: Testing Properties endpoint...");
    let properties, propertiesError;
    try {
      properties = await bridgeFetch(`/${DATASET_ID}/Properties?$top=5`);
    } catch (err) {
      propertiesError = err.message;
      console.log("⚠️ Properties endpoint failed:", err.message);
    }

    return Response.json({
      success: true,
      datasets: {
        keys: Object.keys(datasets),
        hasValue: !!datasets.value,
        hasBundle: !!datasets.bundle,
        count: availableDatasets.length,
        availableDatasetIds: datasetIds,
        currentDatasetId: DATASET_ID,
        isCurrentDatasetValid: datasetIds.includes(DATASET_ID),
        sample: datasets.value?.[0] || datasets.bundle?.[0] || null,
      },
      listings: listings ? {
        keys: Object.keys(listings),
        hasValue: !!listings.value,
        hasBundle: !!listings.bundle,
        count: listings.value?.length || listings.bundle?.length || 0,
        odataCount: listings["@odata.count"],
        sample: listings.value?.[0] || listings.bundle?.[0] || null,
      } : {
        error: listingsError,
        status: "failed"
      },
      properties: properties ? {
        keys: Object.keys(properties),
        hasValue: !!properties.value,
        hasBundle: !!properties.bundle,
        count: properties.value?.length || properties.bundle?.length || 0,
        odataCount: properties["@odata.count"],
        sample: properties.value?.[0] || properties.bundle?.[0] || null,
      } : {
        error: propertiesError,
        status: "failed"
      },
      recommendations: {
        useEndpoint: listings ? "Listings" : properties ? "Properties" : "Unknown - check API documentation",
        datasetId: datasetIds.includes(DATASET_ID) ? DATASET_ID : (datasetIds[0] || DATASET_ID),
      }
    });
  } catch (err) {
    return Response.json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    }, { status: 500 });
  }
}

