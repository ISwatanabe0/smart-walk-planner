import { NextRequest, NextResponse } from "next/server";
import type { RoutePreferences } from "@/types/preferences";
import type { Coordinate } from "@/types/map";

type GenerateRouteRequest = {
  start: Coordinate;
  distanceMeters?: number;
  durationMinutes?: number | null;
  preferences?: Partial<RoutePreferences>;
  options?: {
    candidateCount?: number;
    searchRadiusMeters?: number;
  };
};

// TODO: Replace with actual route generation using Overpass API + A* algorithm
export async function POST(request: NextRequest) {
  let body: GenerateRouteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PARAMETER", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  if (
    typeof body.start?.lat !== "number" ||
    typeof body.start?.lng !== "number"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_PARAMETER", message: "start.lat and start.lng are required" },
      },
      { status: 400 }
    );
  }

  const { lat, lng } = body.start;
  const distanceMeters = body.distanceMeters ?? 3000;
  const candidateCount = Math.min(body.options?.candidateCount ?? 3, 5);

  const routes = Array.from({ length: candidateCount }, (_, i) => {
    const offset = i * 0.001;
    return {
      routeId: `route-${String(i + 1).padStart(3, "0")}`,
      summary: {
        distanceMeters: Math.round(distanceMeters * (0.95 + i * 0.05)),
        estimatedMinutes: Math.round((distanceMeters / 1000) * 12 + i * 2),
        sceneryScore: 80 - i * 5,
        trafficLightScore: 70 + i * 3,
        mainRoadAvoidanceScore: 85 - i * 4,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [lng, lat],
          [lng + 0.002 + offset, lat + 0.003],
          [lng + 0.005 + offset, lat + 0.002],
          [lng + 0.004 + offset, lat - 0.001],
          [lng, lat],
        ],
      },
      waypoints: i === 0
        ? [{ name: "近隣公園", lat: lat + 0.003, lng: lng + 0.002, type: "park" as const }]
        : [],
      tags: [
        ...(body.preferences?.scenery === true ? ["景観重視" as const] : []),
        ...(body.preferences?.avoidTrafficLights === true ? ["信号少なめ" as const] : []),
        ...(body.preferences?.avoidMainRoads === true ? ["大通り回避" as const] : []),
        ...(body.preferences?.loopRoute === true ? ["周回ルート" as const] : []),
      ],
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      routes,
      searchArea: { radiusMeters: Math.round(distanceMeters / 2) },
    },
  });
}
