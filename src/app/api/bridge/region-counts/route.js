import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET() {
  const data = await bridgeFetch(
    `/${DATASET_ID}/listings?limit=500&PropertyType=Residential&StandardStatus=Active`
  );

  const counts = {};

  (data.bundle || []).forEach((item) => {
    if (!item.City) return;
    counts[item.City] = (counts[item.City] || 0) + 1;
  });

  return Response.json(counts);
}
