const BASE_URL = process.env.BRIDGE_API_BASE;
const TOKEN = process.env.BRIDGE_SERVER_TOKEN;

export async function bridgeFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}&access_token=${TOKEN}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bridge API error: ${text}`);
  }

  return res.json();
}
