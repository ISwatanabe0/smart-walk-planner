import { NextRequest, NextResponse } from "next/server";
import {
  destinationPoint,
  haversineDistance,
  initialBearing,
} from "@/lib/geo/destination";
import { fetchOsrmRoute } from "@/lib/routing/osrm";
import { WALKING_SPEED_METERS_PER_MINUTE } from "@/constants/defaultValues";
import type { RoutePreferences, RouteType } from "@/types/preferences";
import type { Coordinate } from "@/types/map";
import type { RouteTag } from "@/types/route";

type GenerateRouteRequest = {
  start: Coordinate;
  end?: Coordinate | null;
  routeType?: RouteType;
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

/** 片道ルートで候補に変化をつけるための最小迂回幅（直線距離に対する比率） */
const MIN_DETOUR_RATIO = 0.25;

function buildRouteTags(
  preferences: Partial<RoutePreferences>,
  routeType: RouteType
): RouteTag[] {
  const tags: RouteTag[] = [];
  if (preferences.scenery === true) tags.push("景観重視");
  if (preferences.avoidTrafficLights === true) tags.push("信号少なめ");
  if (preferences.avoidMainRoads === true) tags.push("大通り回避");
  if (preferences.includeSightseeing === true) tags.push("観光名所あり");
  tags.push(routeType === "loop" ? "周回ルート" : "片道ルート");
  return tags;
}

function isValidCoordinate(value: Coordinate | null | undefined): value is Coordinate {
  return typeof value?.lat === "number" && typeof value?.lng === "number";
}

/**
 * 周回ルート: 出発地点を中心に経由点を三角形状に配置し、出発地点へ戻る
 * 候補ごとの経由点リストを返す
 */
function buildLoopWaypointSets(
  start: Coordinate,
  distanceMeters: number,
  candidateCount: number
): { waypointSets: Coordinate[][]; radiusMeters: number } {
  // 目標距離 = 半径 × PERIMETER_TO_RADIUS_RATIO × ROAD_TO_STRAIGHT_RATIO
  const radius = distanceMeters / (PERIMETER_TO_RADIUS_RATIO * ROAD_TO_STRAIGHT_RATIO);

  const waypointSets = CANDIDATE_BASE_BEARINGS.slice(0, candidateCount).map(
    (baseBearing) => {
      const wp1 = destinationPoint(start, baseBearing, radius);
      const wp2 = destinationPoint(start, baseBearing + 120, radius);
      return [start, wp1, wp2, start];
    }
  );
  return { waypointSets, radiusMeters: radius };
}

/**
 * 片道ルート: 直行ルートと、中間点を左右に膨らませた迂回ルートを候補にする
 */
function buildOnewayWaypointSets(
  start: Coordinate,
  end: Coordinate,
  distanceMeters: number,
  candidateCount: number
): { waypointSets: Coordinate[][]; radiusMeters: number } {
  const straight = haversineDistance(start, end);
  const bearing = initialBearing(start, end);
  const midpoint = destinationPoint(start, bearing, straight / 2);

  // 目標距離（道路距離）を直線距離換算した経路長 L に対し、
  // 中間点の横方向オフセット h は 2√((S/2)² + h²) = L から求める
  const targetStraight = Math.max(
    distanceMeters / ROAD_TO_STRAIGHT_RATIO,
    straight
  );
  const minOffset = straight * MIN_DETOUR_RATIO;
  const offset = Math.max(
    Math.sqrt(Math.max((targetStraight / 2) ** 2 - (straight / 2) ** 2, 0)),
    minOffset
  );

  const detourRight = destinationPoint(midpoint, bearing + 90, offset);
  const detourLeft = destinationPoint(midpoint, bearing - 90, offset);

  const waypointSets = [
    [start, end],
    [start, detourRight, end],
    [start, detourLeft, end],
  ].slice(0, candidateCount);
  return { waypointSets, radiusMeters: straight / 2 + offset };
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

  if (!isValidCoordinate(body.start)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_PARAMETER", message: "start.lat and start.lng are required" },
      },
      { status: 400 }
    );
  }

  const routeType: RouteType = body.routeType ?? "loop";

  if (routeType === "oneway" && !isValidCoordinate(body.end)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "end.lat and end.lng are required for oneway routes",
        },
      },
      { status: 400 }
    );
  }

  const start = body.start;
  const distanceMeters = body.distanceMeters ?? 3000;
  const preferences = body.preferences ?? {};
  const candidateCount = Math.min(body.options?.candidateCount ?? 3, 5);
  const tags = buildRouteTags(preferences, routeType);

  const { waypointSets, radiusMeters } =
    routeType === "oneway" && isValidCoordinate(body.end)
      ? buildOnewayWaypointSets(start, body.end, distanceMeters, candidateCount)
      : buildLoopWaypointSets(start, distanceMeters, candidateCount);

  const candidatePromises = waypointSets.map(async (waypoints, i) => {
    const osrm = await fetchOsrmRoute(waypoints);

    // 公開OSRMサーバーの duration は車速ベースで実態より大幅に短いため、
    // 徒歩速度（80m/分 ≒ 4.8km/h）から所要時間を算出する
    const estimatedMinutes = Math.round(
      osrm.distanceMeters / WALKING_SPEED_METERS_PER_MINUTE
    );

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
  });

  try {
    const routes = await Promise.all(candidatePromises);

    return NextResponse.json({
      success: true,
      data: {
        routes,
        searchArea: { radiusMeters: Math.round(radiusMeters) },
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
