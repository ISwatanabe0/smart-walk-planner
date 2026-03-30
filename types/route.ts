import type { Coordinate, RouteGeometry } from "./map";

export type WaypointType =
  | "park"
  | "tourism"
  | "waterfront"
  | "landmark"
  | "generic";

export type Waypoint = {
  id: string;
  name: string;
  position: Coordinate;
  type: WaypointType;
  description?: string;
};

export type RouteTag =
  | "景観重視"
  | "信号少なめ"
  | "大通り回避"
  | "観光名所あり"
  | "周回ルート";

export type RouteSummary = {
  distanceMeters: number;
  estimatedMinutes: number;
  sceneryScore: number;
  trafficLightScore: number;
  mainRoadAvoidanceScore: number;
  overlapRate?: number;
};

export type WalkRoute = {
  routeId: string;
  name?: string;
  summary: RouteSummary;
  geometry: RouteGeometry;
  start: Coordinate;
  end: Coordinate;
  waypoints: Waypoint[];
  tags: RouteTag[];
};

export type RouteCandidate = WalkRoute & {
  score: number;
  distanceGap: number;
  similarityScore?: number;
};

export type HighwayType =
  | "footway"
  | "path"
  | "pedestrian"
  | "residential"
  | "service"
  | "living_street"
  | "secondary"
  | "primary"
  | "trunk"
  | "unknown";

export type GraphNode = {
  id: string;
  position: Coordinate;
  tags: Record<string, string>;
  trafficSignal: boolean;
  poiScore: number;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  distance: number;
  highwayType: HighwayType;
  sceneryScore: number;
  trafficPenalty: number;
  mainRoadPenalty: number;
  sightseeingBonus: number;
  walkabilityScore: number;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
