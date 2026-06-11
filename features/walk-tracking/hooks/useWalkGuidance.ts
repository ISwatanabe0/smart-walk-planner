"use client";

import { useMemo } from "react";
import {
  nearestPointOnPath,
  routeBearingAhead,
  relativeTurn,
  evaluateGoalPhase,
  OFF_ROUTE_THRESHOLD_METERS,
  type TurnDirection,
  type GoalPhase,
} from "@/lib/geo/guidance";
import { haversineDistance } from "@/lib/geo/destination";
import type { Coordinate } from "@/types/map";
import type { WalkRoute } from "@/types/route";
import type { GpsTracking } from "./useGpsTracking";

export type WalkGuidance = {
  /** 案内が有効か（トラッキング中かつルート・現在地あり） */
  isActive: boolean;
  /** 次に進むべき方向（進行方位が未確定なら null） */
  turn: TurnDirection | null;
  /** ゴールまでの残り距離（メートル、未確定なら null） */
  distanceToGoalMeters: number | null;
  /** ルートから外れているか */
  isOffRoute: boolean;
  /** ゴール接近フェーズ */
  goalPhase: GoalPhase;
};

/**
 * トラッキング状態と選択中ルートから、進行方向・残り距離・逸脱・ゴール接近を導出する。
 */
export function useWalkGuidance(
  tracking: GpsTracking,
  route: WalkRoute | null
): WalkGuidance {
  const { isTracking, currentPosition, headingDeg, walkedMeters } = tracking;

  return useMemo<WalkGuidance>(() => {
    const path: Coordinate[] = route?.geometry.coordinates ?? [];
    const inactive: WalkGuidance = {
      isActive: false,
      turn: null,
      distanceToGoalMeters: null,
      isOffRoute: false,
      goalPhase: "none",
    };

    if (!isTracking || currentPosition === null || path.length < 2) {
      return inactive;
    }

    const { distanceMeters: offset, segmentIndex } = nearestPointOnPath(
      currentPosition,
      path
    );
    const isOffRoute = offset > OFF_ROUTE_THRESHOLD_METERS;

    // ゴール（ルート終点）までの残距離
    const goal = path[path.length - 1];
    const distanceToGoalMeters = haversineDistance(currentPosition, goal);

    // 進むべき方位と、現在の進行方位から曲がる方向を求める
    const targetBearing = routeBearingAhead(path, segmentIndex);
    const turn =
      headingDeg !== null && targetBearing !== null
        ? relativeTurn(headingDeg, targetBearing)
        : null;

    const goalPhase = evaluateGoalPhase({
      distanceToGoalMeters,
      walkedMeters,
      routeDistanceMeters: route?.summary.distanceMeters ?? 0,
    });

    return {
      isActive: true,
      turn,
      distanceToGoalMeters,
      isOffRoute,
      goalPhase,
    };
  }, [isTracking, currentPosition, headingDeg, walkedMeters, route]);
}
