import type { Coordinate } from "./map";

export type RoutePreferences = {
  scenery: boolean;
  avoidTrafficLights: boolean;
  avoidMainRoads: boolean;
  includeSightseeing: boolean;
  loopRoute: boolean;
};

export type RouteSearchCondition = {
  start: Coordinate | null;
  distanceMeters: number;
  durationMinutes: number | null;
  preferences: RoutePreferences;
};

export type ValidationError = {
  field: string;
  message: string;
};
