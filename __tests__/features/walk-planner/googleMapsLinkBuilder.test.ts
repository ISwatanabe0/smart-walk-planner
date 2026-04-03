import { buildGoogleMapsUrl } from "@/features/walk-planner/services/googleMapsLinkBuilder";
import type { WalkRoute } from "@/types/route";
import type { Coordinate } from "@/types/map";

const START: Coordinate = { lat: 35.6812, lng: 139.7671 };

function makeRoute(overrides: Partial<WalkRoute> = {}): WalkRoute {
  return {
    routeId: "route-001",
    summary: {
      distanceMeters: 3000,
      estimatedMinutes: 40,
      sceneryScore: 80,
      trafficLightScore: 70,
      mainRoadAvoidanceScore: 85,
    },
    geometry: { type: "LineString", coordinates: [START, START] },
    start: START,
    end: START,
    waypoints: [],
    tags: [],
    ...overrides,
  };
}

describe("buildGoogleMapsUrl", () => {
  describe("基本動作", () => {
    it("route が null のとき null を返す", () => {
      expect(buildGoogleMapsUrl(null)).toBeNull();
    });

    it("返り値は Google Maps dir URL で始まる", () => {
      const url = buildGoogleMapsUrl(makeRoute());
      expect(url).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?/);
    });

    it("origin に start の座標が含まれる", () => {
      const url = decodeURIComponent(buildGoogleMapsUrl(makeRoute()) ?? "");
      expect(url).toContain(`origin=${START.lat},${START.lng}`);
    });

    it("destination に end の座標が含まれる", () => {
      const end: Coordinate = { lat: 35.700, lng: 139.780 };
      const url = decodeURIComponent(buildGoogleMapsUrl(makeRoute({ end })) ?? "");
      expect(url).toContain(`destination=${end.lat},${end.lng}`);
    });

    it("travelmode=walking が含まれる", () => {
      const url = buildGoogleMapsUrl(makeRoute());
      expect(url).toContain("travelmode=walking");
    });
  });

  describe("周回ルート（start === end）", () => {
    it("3点以上の geometry があるとき waypoints が設定される", () => {
      // Given: 周回ルート（start = end、中間点あり）
      const coords: Coordinate[] = [
        { lat: 35.6812, lng: 139.7671 },
        { lat: 35.6850, lng: 139.7700 },
        { lat: 35.6880, lng: 139.7650 },
        { lat: 35.6812, lng: 139.7671 }, // 出発点に戻る
      ];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: coords[0],
        end: coords[coords.length - 1],
      });
      // When
      const url = buildGoogleMapsUrl(route);
      // Then: waypoints が含まれる
      expect(url).toContain("waypoints=");
    });

    it("中間点の座標が waypoints に含まれる", () => {
      // Given
      const mid1: Coordinate = { lat: 35.6850, lng: 139.7700 };
      const mid2: Coordinate = { lat: 35.6880, lng: 139.7650 };
      const coords: Coordinate[] = [START, mid1, mid2, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: coords[0],
        end: coords[coords.length - 1],
      });
      // When
      const url = decodeURIComponent(buildGoogleMapsUrl(route) ?? "");
      // Then: 中間点が waypoints に含まれる
      expect(url).toContain(`${mid1.lat},${mid1.lng}`);
      expect(url).toContain(`${mid2.lat},${mid2.lng}`);
    });

    it("start・end は waypoints に含まれない（中間点のみ）", () => {
      // Given
      const mid: Coordinate = { lat: 35.6850, lng: 139.7700 };
      const coords: Coordinate[] = [START, mid, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: coords[0],
        end: coords[coords.length - 1],
      });
      // When
      const url = buildGoogleMapsUrl(route);
      // Then: waypoints には mid のみ（START は origin/destination）
      const waypointsMatch = url?.match(/waypoints=([^&]+)/);
      expect(waypointsMatch).not.toBeNull();
      const waypointStr = decodeURIComponent(waypointsMatch![1]);
      expect(waypointStr).toBe(`${mid.lat},${mid.lng}`);
    });
  });

  describe("waypoints のサンプリング（座標数が多い場合）", () => {
    it("中間点が 9 点以下の場合は全点を waypoints に設定する", () => {
      // Given: 中間点5点
      const inner: Coordinate[] = Array.from({ length: 5 }, (_, i) => ({
        lat: 35.68 + i * 0.001,
        lng: 139.77,
      }));
      const coords = [START, ...inner, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: START,
        end: START,
      });
      // When
      const url = buildGoogleMapsUrl(route);
      const waypointsMatch = url?.match(/waypoints=([^&]+)/);
      const waypointStr = decodeURIComponent(waypointsMatch![1]);
      // Then: | で区切られた5つのエントリ
      expect(waypointStr.split("|")).toHaveLength(5);
    });

    it("中間点が 9 点を超える場合は最大 9 点にサンプリングされる", () => {
      // Given: 中間点20点
      const inner: Coordinate[] = Array.from({ length: 20 }, (_, i) => ({
        lat: 35.68 + i * 0.001,
        lng: 139.77,
      }));
      const coords = [START, ...inner, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: START,
        end: START,
      });
      // When
      const url = buildGoogleMapsUrl(route);
      const waypointsMatch = url?.match(/waypoints=([^&]+)/);
      const waypointStr = decodeURIComponent(waypointsMatch![1]);
      // Then: 9点以下にサンプリング
      expect(waypointStr.split("|").length).toBeLessThanOrEqual(9);
    });
  });

  describe("2点のみの geometry（中間点なし）", () => {
    it("geometry が2点以下のとき waypoints は設定されない", () => {
      // Given: start と end の2点のみ
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: [START, START] },
        start: START,
        end: START,
      });
      // When
      const url = buildGoogleMapsUrl(route);
      // Then: waypoints なし
      expect(url).not.toContain("waypoints");
    });
  });
});
