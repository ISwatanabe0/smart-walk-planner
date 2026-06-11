import {
  nearestPointOnPath,
  relativeTurn,
  evaluateGoalPhase,
  routeBearingAhead,
} from "@/lib/geo/guidance";
import { destinationPoint } from "@/lib/geo/destination";
import type { Coordinate } from "@/types/map";

const TOKYO: Coordinate = { lat: 35.6812, lng: 139.7671 };

describe("nearestPointOnPath", () => {
  it("経路上の点は距離ほぼ0", () => {
    const path: Coordinate[] = [
      TOKYO,
      destinationPoint(TOKYO, 90, 100),
      destinationPoint(TOKYO, 90, 200),
    ];
    const { distanceMeters } = nearestPointOnPath(path[1], path);
    expect(distanceMeters).toBeLessThan(2);
  });

  it("経路から離れた点はおおよその距離を返す", () => {
    const path: Coordinate[] = [TOKYO, destinationPoint(TOKYO, 90, 200)];
    // 経路の中間から北へ50m
    const mid = destinationPoint(TOKYO, 90, 100);
    const off = destinationPoint(mid, 0, 50);
    const { distanceMeters } = nearestPointOnPath(off, path);
    expect(distanceMeters).toBeGreaterThan(40);
    expect(distanceMeters).toBeLessThan(60);
  });

  it("空の経路では Infinity", () => {
    expect(nearestPointOnPath(TOKYO, []).distanceMeters).toBe(Infinity);
  });
});

describe("relativeTurn", () => {
  it("ほぼ同方位は直進", () => {
    expect(relativeTurn(90, 95)).toBe("straight");
    expect(relativeTurn(0, 350)).toBe("straight");
  });

  it("右方向への変化を右と判定", () => {
    expect(relativeTurn(0, 90)).toBe("right");
    expect(relativeTurn(0, 40)).toBe("slight-right");
  });

  it("左方向への変化を左と判定", () => {
    expect(relativeTurn(0, 270)).toBe("left");
    expect(relativeTurn(0, 320)).toBe("slight-left");
  });

  it("真後ろはUターン", () => {
    expect(relativeTurn(0, 180)).toBe("u-turn");
  });
});

describe("routeBearingAhead", () => {
  it("東向きの経路では約90°を返す", () => {
    const path: Coordinate[] = [
      TOKYO,
      destinationPoint(TOKYO, 90, 50),
      destinationPoint(TOKYO, 90, 100),
    ];
    const bearing = routeBearingAhead(path, 0, 30);
    expect(bearing).not.toBeNull();
    expect(Math.abs((bearing as number) - 90)).toBeLessThan(5);
  });
});

describe("evaluateGoalPhase", () => {
  it("歩き始め（規定距離未満）は none", () => {
    const phase = evaluateGoalPhase({
      distanceToGoalMeters: 10,
      walkedMeters: 50,
      routeDistanceMeters: 3000,
    });
    expect(phase).toBe("none");
  });

  it("十分歩いてゴール接近で approaching", () => {
    const phase = evaluateGoalPhase({
      distanceToGoalMeters: 100,
      walkedMeters: 2800,
      routeDistanceMeters: 3000,
    });
    expect(phase).toBe("approaching");
  });

  it("十分歩いてゴール到達で arrived", () => {
    const phase = evaluateGoalPhase({
      distanceToGoalMeters: 15,
      walkedMeters: 2900,
      routeDistanceMeters: 3000,
    });
    expect(phase).toBe("arrived");
  });

  it("ゴールから遠ければ none", () => {
    const phase = evaluateGoalPhase({
      distanceToGoalMeters: 500,
      walkedMeters: 2000,
      routeDistanceMeters: 3000,
    });
    expect(phase).toBe("none");
  });
});
