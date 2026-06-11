import type { Coordinate } from "./map";

export type RoutePreferences = {
  scenery: boolean;
  avoidTrafficLights: boolean;
  avoidMainRoads: boolean;
  includeSightseeing: boolean;
};

/** 周回（出発地点に戻る）か片道（ゴール地点まで）か */
export type RouteType = "loop" | "oneway";

export type RouteSearchCondition = {
  start: Coordinate | null;
  /** 片道ルートのゴール地点（周回ルートでは使用しない） */
  end: Coordinate | null;
  routeType: RouteType;
  distanceMeters: number;
  durationMinutes: number | null;
  preferences: RoutePreferences;
};

export type ValidationError = {
  field: string;
  message: string;
};
