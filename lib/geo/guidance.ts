import { haversineDistance, initialBearing } from "./destination";
import type { Coordinate } from "@/types/map";

/** これ以上ルートから離れたら「逸脱」とみなす（メートル） */
export const OFF_ROUTE_THRESHOLD_METERS = 40;

/** ゴール接近の演出を始める距離（メートル） */
export const NEAR_GOAL_METERS = 150;

/** 到着とみなす距離（メートル） */
export const ARRIVAL_METERS = 30;

/**
 * 点からポリライン（ルート）への最短距離と、最も近い区間のインデックスを返す。
 * 短距離前提の平面近似（正距円筒図法）により点と線分の距離を計算する。
 */
export function nearestPointOnPath(
  position: Coordinate,
  path: Coordinate[]
): { distanceMeters: number; segmentIndex: number } {
  if (path.length === 0) {
    return { distanceMeters: Infinity, segmentIndex: 0 };
  }
  if (path.length === 1) {
    return {
      distanceMeters: haversineDistance(position, path[0]),
      segmentIndex: 0,
    };
  }

  // 緯度に応じた縮尺で平面座標（メートル）へ近似投影する
  const METERS_PER_DEG_LAT = 111320;
  const metersPerDegLng =
    METERS_PER_DEG_LAT * Math.cos((position.lat * Math.PI) / 180);
  const toXY = (c: Coordinate): [number, number] => [
    (c.lng - position.lng) * metersPerDegLng,
    (c.lat - position.lat) * METERS_PER_DEG_LAT,
  ];

  let best = Infinity;
  let bestIndex = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = toXY(path[i]);
    const [bx, by] = toXY(path[i + 1]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t =
      len2 === 0 ? 0 : Math.max(0, Math.min(1, (-ax * dx - ay * dy) / len2));
    const px = ax + t * dx;
    const py = ay + t * dy;
    const dist = Math.sqrt(px * px + py * py);
    if (dist < best) {
      best = dist;
      bestIndex = i;
    }
  }
  return { distanceMeters: best, segmentIndex: bestIndex };
}

/**
 * ルート上の指定区間から少し先（lookAheadMeters）へ向かう方位角を返す。
 * 「次にどちらへ進むべきか」の指示に使う。
 */
export function routeBearingAhead(
  path: Coordinate[],
  segmentIndex: number,
  lookAheadMeters = 30
): number | null {
  if (path.length < 2) {
    return null;
  }
  const from = path[Math.min(segmentIndex, path.length - 2)];
  let remaining = lookAheadMeters;
  let i = Math.min(segmentIndex, path.length - 2);
  let to = path[i + 1];
  while (i < path.length - 1) {
    const seg = haversineDistance(path[i], path[i + 1]);
    to = path[i + 1];
    if (seg >= remaining) {
      break;
    }
    remaining -= seg;
    i++;
  }
  return initialBearing(from, to);
}

export type TurnDirection =
  | "straight"
  | "slight-right"
  | "right"
  | "slight-left"
  | "left"
  | "u-turn";

/**
 * 進行方位とルートの先の方位から、曲がる方向を判定する。
 * @param headingDeg 現在の進行方位（北=0、時計回り）
 * @param targetBearingDeg 進むべき方位
 */
export function relativeTurn(
  headingDeg: number,
  targetBearingDeg: number
): TurnDirection {
  // -180〜180 に正規化（正=右、負=左）
  let diff = ((targetBearingDeg - headingDeg + 540) % 360) - 180;
  if (Math.abs(diff) <= 25) return "straight";
  if (Math.abs(diff) >= 150) return "u-turn";
  if (diff > 0) return diff <= 80 ? "slight-right" : "right";
  return diff >= -80 ? "slight-left" : "left";
}

export type GoalPhase = "none" | "approaching" | "arrived";

/**
 * ゴール到達フェーズを判定する。
 * 周回ルートは出発地点＝ゴールのため、ルートの一定割合を歩くまでは判定しない
 * （スタート直後に「到着」と誤判定されるのを防ぐ）。
 */
export function evaluateGoalPhase(params: {
  distanceToGoalMeters: number;
  walkedMeters: number;
  routeDistanceMeters: number;
}): GoalPhase {
  const { distanceToGoalMeters, walkedMeters, routeDistanceMeters } = params;
  const minWalked = Math.min(200, routeDistanceMeters * 0.4);
  if (walkedMeters < minWalked) {
    return "none";
  }
  if (distanceToGoalMeters <= ARRIVAL_METERS) {
    return "arrived";
  }
  if (distanceToGoalMeters <= NEAR_GOAL_METERS) {
    return "approaching";
  }
  return "none";
}
