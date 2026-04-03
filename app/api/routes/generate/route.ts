import { NextRequest, NextResponse } from "next/server";
import { destinationPoint } from "@/lib/geo/destination";
import { fetchOsrmRoute } from "@/lib/routing/osrm";
import type { RoutePreferences } from "@/types/preferences";
import type { Coordinate } from "@/types/map";
import type { RouteTag } from "@/types/route";

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

/**
 * 三角形ルートの直線周長 / 半径 の比率
 * 2つの経由点を120°間隔で配置した場合: (2 + √3) ≈ 3.732
 */
const PERIMETER_TO_RADIUS_RATIO = 2 + Math.sqrt(3);

/**
 * 道路距離 / 直線距離 の比率（都市部の経験値）
 * 実際の道路は直線より約1.4倍長くなる傾向がある
 */
const ROAD_TO_STRAIGHT_RATIO = 1.4;

/** 各候補ルートの初期方位（度）*/
const CANDIDATE_BASE_BEARINGS = [0, 60, 120] as const;

function buildRouteTags(preferences: Partial<RoutePreferences>): RouteTag[] {
  const tags: RouteTag[] = [];
  if (preferences.scenery === true) tags.push("景観重視");
  if (preferences.avoidTrafficLights === true) tags.push("信号少なめ");
  if (preferences.avoidMainRoads === true) tags.push("大通り回避");
  if (preferences.includeSightseeing === true) tags.push("観光名所あり");
  if (preferences.loopRoute === true) tags.push("周回ルート");
  return tags;
}

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

  const start = body.start;
  const distanceMeters = body.distanceMeters ?? 3000;
  const preferences = body.preferences ?? {};
  const candidateCount = Math.min(body.options?.candidateCount ?? 3, 5);
  const tags = buildRouteTags(preferences);

  // 三角形ルートの半径計算
  // 目標距離 = 半径 × PERIMETER_TO_RADIUS_RATIO × ROAD_TO_STRAIGHT_RATIO
  const radius = distanceMeters / (PERIMETER_TO_RADIUS_RATIO * ROAD_TO_STRAIGHT_RATIO);

  // 各候補の経由点を並列生成してOSRMにリクエスト
  const candidatePromises = CANDIDATE_BASE_BEARINGS.slice(0, candidateCount).map(
    async (baseBearing, i) => {
      // 2つの経由点を120°間隔で配置
      const wp1 = destinationPoint(start, baseBearing, radius);
      const wp2 = destinationPoint(start, baseBearing + 120, radius);

      // OSRM: 出発 → 経由1 → 経由2 → 出発（周回ルート）
      const osrm = await fetchOsrmRoute([start, wp1, wp2, start]);

      const estimatedMinutes = Math.round(osrm.durationSeconds / 60);

      return {
        routeId: `route-${String(i + 1).padStart(3, "0")}`,
        summary: {
          distanceMeters: osrm.distanceMeters,
          estimatedMinutes,
          sceneryScore: 70 + i * 3,
          trafficLightScore: 75 - i * 2,
          mainRoadAvoidanceScore: 80 - i * 5,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: osrm.coordinates, // [lng, lat][] — GeoJSON形式
        },
        waypoints: [] as Array<{
          name: string;
          lat: number;
          lng: number;
          type: "generic";
        }>,
        tags,
      };
    }
  );

  try {
    const routes = await Promise.all(candidatePromises);

    return NextResponse.json({
      success: true,
      data: {
        routes,
        searchArea: { radiusMeters: Math.round(radius) },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ルート生成に失敗しました";
    return NextResponse.json(
      { success: false, error: { code: "ROUTE_GENERATION_FAILED", message } },
      { status: 502 }
    );
  }
}
