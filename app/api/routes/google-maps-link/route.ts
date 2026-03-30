import { NextRequest, NextResponse } from "next/server";

type LatLng = { lat: number; lng: number };

type GoogleMapsLinkRequest = {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  travelMode?: string;
};

export async function POST(request: NextRequest) {
  let body: GoogleMapsLinkRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PARAMETER", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  if (
    typeof body.origin?.lat !== "number" ||
    typeof body.origin?.lng !== "number" ||
    typeof body.destination?.lat !== "number" ||
    typeof body.destination?.lng !== "number"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_PARAMETER", message: "origin and destination are required" },
      },
      { status: 400 }
    );
  }

  const origin = `${body.origin.lat},${body.origin.lng}`;
  const destination = `${body.destination.lat},${body.destination.lng}`;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "walking",
  });

  if (body.waypoints !== undefined && body.waypoints.length > 0) {
    const waypointStr = body.waypoints
      .map((wp) => `${wp.lat},${wp.lng}`)
      .join("|");
    params.set("waypoints", waypointStr);
  }

  const url = `https://www.google.com/maps/dir/?${params.toString()}`;

  return NextResponse.json({ success: true, data: { url } });
}
