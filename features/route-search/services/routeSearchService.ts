import type { RouteSearchCondition } from "@/types/preferences";
import type { WalkRoute, WaypointType, RouteTag } from "@/types/route";
import type { Coordinate } from "@/types/map";

type ApiCoordinate = [number, number];

type ApiWaypoint = {
  name: string;
  lat: number;
  lng: number;
  type: WaypointType;
};

type ApiRoute = {
  routeId: string;
  summary: {
    distanceMeters: number;
    estimatedMinutes: number;
    sceneryScore: number;
    trafficLightScore: number;
    mainRoadAvoidanceScore: number;
  };
  geometry: {
    type: "LineString";
    coordinates: ApiCoordinate[];
  };
  waypoints: ApiWaypoint[];
  tags: RouteTag[];
};

type ApiRoutesResponse = {
  data: {
    routes: ApiRoute[];
  };
};

function mapApiRouteToWalkRoute(apiRoute: ApiRoute): WalkRoute {
  const coordinates: Coordinate[] = apiRoute.geometry.coordinates.map(
    ([lng, lat]) => ({ lat, lng })
  );
  return {
    routeId: apiRoute.routeId,
    summary: apiRoute.summary,
    geometry: { type: "LineString", coordinates },
    start: coordinates[0],
    end: coordinates[coordinates.length - 1],
    waypoints: apiRoute.waypoints.map((wp, index) => ({
      id: `${apiRoute.routeId}-wp-${index}`,
      name: wp.name,
      position: { lat: wp.lat, lng: wp.lng },
      type: wp.type,
    })),
    tags: apiRoute.tags,
  };
}

export async function searchRoutes(
  condition: RouteSearchCondition
): Promise<WalkRoute[]> {
  const response = await fetch("/api/routes/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start: condition.start,
      distanceMeters: condition.distanceMeters,
      durationMinutes: condition.durationMinutes,
      preferences: condition.preferences,
    }),
  });

  if (!response.ok) {
    throw new Error("ルート検索に失敗しました");
  }

  const data: ApiRoutesResponse = await response.json();
  return data.data.routes.map(mapApiRouteToWalkRoute);
}
