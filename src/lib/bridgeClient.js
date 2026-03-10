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

  // Suppress verbose URL logging - only log if needed for debugging
  // if (process.env.NODE_ENV === "development") {
  //   console.log("🌐 Bridge API URL:", url.replace(SERVER_TOKEN, "***TOKEN***"));
  // }

  if (!SERVER_TOKEN) {
    throw new Error("BRIDGE_SERVER_TOKEN is not set in environment variables");
  }

  let res;
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError) {
    // Handle network errors (timeout, connection refused, etc.)
    const isTimeout = fetchError.name === 'AbortError';
    const errorMessage = isTimeout
      ? 'Bridge API request timed out after 30 seconds'
      : (fetchError.message || 'Network error connecting to Bridge API');
    
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Bridge API Network Error:", {
        error: errorMessage,
        endpoint: cleanEndpoint.split("?")[0],
        url: url.replace(SERVER_TOKEN, "***TOKEN***"),
      });
    }
    
    throw new Error(`Bridge API network error: ${errorMessage}`);
  }

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = `Bridge API error (${res.status}): ${res.statusText}`;
    const is404 = res.status === 404;
    const isExpected404 = is404 && (cleanEndpoint.includes("ListingHistory") || cleanEndpoint.includes("PropertyHistory"));
    
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
        // Only log non-404 errors, or 404s that aren't expected (like ListingHistory)
        // Suppress expected 404s completely (ListingHistory, PropertyHistory)
        if (process.env.NODE_ENV === "development" && !isExpected404) {
          if (is404) {
            // 404 errors are often expected (fallback endpoints) - only log if not a common fallback pattern
            const isCommonFallback = cleanEndpoint.includes("/Listings") && cleanEndpoint.includes("Properties");
            if (!isCommonFallback) {
              // Only log 404s that are unexpected
              console.log("⚠️ Bridge API 404 (trying fallback):", cleanEndpoint.split("?")[0]);
            }
          } else {
            console.error("❌ Bridge API Error (JSON):", {
              status: res.status,
              statusText: res.statusText,
              error: errorData,
              url: url.replace(SERVER_TOKEN, "***TOKEN***"),
            });
          }
        }
      } else {
        const text = await res.text();
        // Suppress expected 404s completely
        if (process.env.NODE_ENV === "development" && !isExpected404) {
          if (is404) {
            // Only log unexpected 404s
            const isCommonFallback = cleanEndpoint.includes("/Listings") && cleanEndpoint.includes("Properties");
            if (!isCommonFallback) {
              console.log("⚠️ Bridge API 404 (trying fallback):", cleanEndpoint.split("?")[0]);
            }
          } else {
            console.error("❌ Bridge API Error (HTML/Text):", {
              status: res.status,
              statusText: res.statusText,
              contentType,
              responsePreview: text.substring(0, 500),
            });
          }
        }
        errorMessage = `Bridge API error (${res.status}): ${res.statusText}. Response is not JSON.`;
      }
    } catch (parseError) {
      if (process.env.NODE_ENV === "development" && !isExpected404) {
        console.error("❌ Failed to parse error response:", parseError);
      }
    }
    
    throw new Error(errorMessage);
  }

  // Check if response is actually JSON before parsing
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Bridge API returned non-JSON response:", {
        contentType,
        preview: text.substring(0, 200),
      });
    }
    throw new Error(`Bridge API returned non-JSON response (${contentType})`);
  }

  const jsonData = await res.json();
  // Suppress verbose response logging - only log errors
  // if (process.env.NODE_ENV === "development") {
  //   console.log("📦 Bridge response:", Object.keys(jsonData).join(", "), "length:", jsonData.value?.length ?? jsonData.bundle?.length ?? 0);
  // }
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
