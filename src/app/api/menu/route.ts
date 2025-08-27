export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional: read the timestamp param if present, but ignore it
  // to keep this endpoint generic and cache-free during development.
  // Example: /api/menu?ts=123
  const ts = new URL(request.url).searchParams.get("ts");
  void ts; // silence unused var warnings; we don't actually use it

  // Return a minimal, empty menu structure. Adjust as needed.
  return Response.json({ items: [] });
}
