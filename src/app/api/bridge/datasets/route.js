import { bridgeFetch } from "@/lib/bridgeClient";

export async function GET() {
  try {
    const data = await bridgeFetch("/datasets?");
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
