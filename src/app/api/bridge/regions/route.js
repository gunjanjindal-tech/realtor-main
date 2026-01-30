import { bridgeFetch } from "@/lib/bridgeClient";
import { DATASET_ID } from "@/lib/bridgeConfig";

export async function GET() {
  const data = await bridgeFetch(
    `/${DATASET_ID}/listings?limit=300&PropertyType=Residential&StandardStatus=Active`
  );

  const map = {};

  (data.bundle || []).forEach((item) => {
    if (!item.City) return;
    map[item.City] = (map[item.City] || 0) + 1;
  });

  return Response.json(map);
}
