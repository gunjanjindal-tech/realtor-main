const BASE_URL = process.env.BRIDGE_API_BASE || "https://api.bridgedataoutput.com/api/v2/OData";
const SERVER_TOKEN = process.env.BRIDGE_SERVER_TOKEN;
const BROWSER_TOKEN = process.env.BRIDGE_BROWSER_TOKEN;

/**
 * Server-side Bridge API fetch
 * Uses Server Token for backend API calls
 */
export async function bridgeFetch(endpoint) {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // Check if endpoint already has query params
  const separator = cleanEndpoint.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${cleanEndpoint}${separator}access_token=${SERVER_TOKEN}`;

  if (process.env.NODE_ENV === "development") {
    console.log("🌐 Bridge API URL:", url.replace(SERVER_TOKEN, "***TOKEN***"));
  }

  if (!SERVER_TOKEN) {
    throw new Error("BRIDGE_SERVER_TOKEN is not set in environment variables");
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = `Bridge API error (${res.status}): ${res.statusText}`;
    
    try {
      if (contentType?.includes("application/json")) {
        const errorData = await res.json();
        // Handle different error response formats
        if (typeof errorData === "object") {
          errorMessage = errorData.error?.message || 
                        errorData.message || 
                        errorData.error || 
                        JSON.stringify(errorData);
        } else {
          errorMessage = String(errorData);
        }
        console.error("❌ Bridge API Error (JSON):", {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
          url: url.replace(SERVER_TOKEN, "***TOKEN***"),
        });
      } else {
        const text = await res.text();
        console.error("❌ Bridge API Error (HTML/Text):", {
          status: res.status,
          statusText: res.statusText,
          contentType,
          responsePreview: text.substring(0, 500),
        });
        errorMessage = `Bridge API error (${res.status}): ${res.statusText}. Response is not JSON.`;
      }
    } catch (parseError) {
      console.error("❌ Failed to parse error response:", parseError);
    }
    
    throw new Error(errorMessage);
  }

  // Check if response is actually JSON before parsing
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    console.error("❌ Bridge API returned non-JSON response:", {
      contentType,
      preview: text.substring(0, 200),
    });
    throw new Error(`Bridge API returned non-JSON response (${contentType})`);
  }

  const jsonData = await res.json();
  if (process.env.NODE_ENV === "development") {
    console.log("📦 Bridge response:", Object.keys(jsonData).join(", "), "length:", jsonData.value?.length ?? jsonData.bundle?.length ?? 0);
  }
  return jsonData;
}

/**
 * Client-side Bridge API fetch
 * Uses Browser Token for frontend API calls
 */
export async function bridgeFetchClient(endpoint) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const separator = cleanEndpoint.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${cleanEndpoint}${separator}access_token=${BROWSER_TOKEN}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bridge API error (${res.status}): ${text}`);
  }

  return res.json();
}
