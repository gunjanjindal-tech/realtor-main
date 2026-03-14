export async function GET(req) {
  return Response.json({ 
    suggestions: [
      { label: "Halifax", type: "city" },
      { label: "Dartmouth", type: "city" },
      { label: "Bedford", type: "city" }
    ]
  });
}