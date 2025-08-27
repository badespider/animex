import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: { code: "DISABLED", message: "Streaming endpoints are disabled in AniList-only mode." } },
    { status: 410 },
  );
}

