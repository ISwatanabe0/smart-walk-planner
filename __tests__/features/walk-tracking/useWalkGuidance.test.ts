import { renderHook } from "@testing-library/react";
import { useWalkGuidance } from "@/features/walk-tracking/hooks/useWalkGuidance";
import { destinationPoint } from "@/lib/geo/destination";
import type { GpsTracking } from "@/features/walk-tracking/hooks/useGpsTracking";
import type { WalkRoute } from "@/types/route";
import type { Coordinate } from "@/types/map";

const TOKYO: Coordinate = { lat: 35.6812, lng: 139.7671 };

function makeTracking(overrides: Partial<GpsTracking> = {}): GpsTracking {
  return {
    isTracking: false,
    currentPosition: null,
    accuracyMeters: null,
    headingDeg: null,
    trail: [],
    walkedMeters: 0,
    elapsedSeconds: 0,
    isScreenLockHeld: false,
    error: null,
    startTracking: jest.fn(),
    stopTracking: jest.fn(),
    ...overrides,
  };
}

// 東へ200m伸びる直線ルート
const eastPath: Coordinate[] = [
  TOKYO,
  destinationPoint(TOKYO, 90, 100),
  destinationPoint(TOKYO, 90, 200),
];

function makeRoute(path: Coordinate[], distanceMeters = 200): WalkRoute {
  return {
    routeId: "r1",
    summary: {
      distanceMeters,
      estimatedMinutes: 3,
      sceneryScore: 70,
      trafficLightScore: 70,
      mainRoadAvoidanceScore: 70,
    },
    geometry: { type: "LineString", coordinates: path },
    start: path[0],
    end: path[path.length - 1],
    waypoints: [],
    tags: [],
  };
}

describe("useWalkGuidance", () => {
  it("非トラッキング時は非アクティブ", () => {
    const { result } = renderHook(() =>
      useWalkGuidance(makeTracking({ isTracking: false }), makeRoute(eastPath))
    );
    expect(result.current.isActive).toBe(false);
  });

  it("ルートがないと非アクティブ", () => {
    const { result } = renderHook(() =>
      useWalkGuidance(
        makeTracking({ isTracking: true, currentPosition: TOKYO }),
        null
      )
    );
    expect(result.current.isActive).toBe(false);
  });

  it("ルート上を東へ進んでいれば直進案内・逸脱なし", () => {
    const tracking = makeTracking({
      isTracking: true,
      currentPosition: destinationPoint(TOKYO, 90, 50),
      headingDeg: 90,
    });
    const { result } = renderHook(() =>
      useWalkGuidance(tracking, makeRoute(eastPath))
    );
    expect(result.current.isActive).toBe(true);
    expect(result.current.isOffRoute).toBe(false);
    expect(result.current.turn).toBe("straight");
    expect(result.current.distanceToGoalMeters).toBeGreaterThan(0);
  });

  it("ルートから大きく外れると isOffRoute", () => {
    // 経路中間から北へ100m
    const off = destinationPoint(destinationPoint(TOKYO, 90, 100), 0, 100);
    const tracking = makeTracking({
      isTracking: true,
      currentPosition: off,
      headingDeg: 0,
    });
    const { result } = renderHook(() =>
      useWalkGuidance(tracking, makeRoute(eastPath))
    );
    expect(result.current.isOffRoute).toBe(true);
  });

  it("ゴール付近かつ十分歩いていれば arrived フェーズ", () => {
    const tracking = makeTracking({
      isTracking: true,
      currentPosition: eastPath[eastPath.length - 1],
      headingDeg: 90,
      walkedMeters: 200,
    });
    const { result } = renderHook(() =>
      useWalkGuidance(tracking, makeRoute(eastPath, 200))
    );
    expect(result.current.goalPhase).toBe("arrived");
  });
});
