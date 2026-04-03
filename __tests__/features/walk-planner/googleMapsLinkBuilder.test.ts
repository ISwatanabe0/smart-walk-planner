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
      expect(url).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//);
    });

    it("travelmode=walking が含まれる", () => {
      const url = buildGoogleMapsUrl(makeRoute());
      expect(url).toContain("travelmode=walking");
    });
  });

  describe("周回ルート（start === end・中間点あり）", () => {
    it("パスベース形式の URL が返る", () => {
      // Given: 周回ルート（start = end、中間点あり）
      const mid: Coordinate = { lat: 35.685, lng: 139.77 };
      const coords: Coordinate[] = [START, mid, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: START,
        end: START,
      });
      // When
      const url = buildGoogleMapsUrl(route);
      // Then: パスベース形式（クエリパラメータ形式ではない）
      expect(url).toMatch(/\/maps\/dir\/.+\/.+\/.+/);
      expect(url).not.toContain("?api=1");
    });

    it("start・中間点・end の全座標がパスに含まれる", () => {
      // Given
      const mid: Coordinate = { lat: 35.685, lng: 139.77 };
      const coords: Coordinate[] = [START, mid, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: START,
        end: START,
      });
      // When
      const url = buildGoogleMapsUrl(route) ?? "";
      // Then
      expect(url).toContain(`${START.lat},${START.lng}`);
      expect(url).toContain(`${mid.lat},${mid.lng}`);
    });

    it("URL の構造が /dir/start/mid/end?travelmode=walking 形式である", () => {
      // Given
      const mid: Coordinate = { lat: 35.685, lng: 139.77 };
      const coords: Coordinate[] = [START, mid, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: coords[0],
        end: coords[coords.length - 1],
      });
      // When
      const url = buildGoogleMapsUrl(route);
      // Then
      const expected = `https://www.google.com/maps/dir/${START.lat},${START.lng}/${mid.lat},${mid.lng}/${START.lat},${START.lng}?travelmode=walking`;
      expect(url).toBe(expected);
    });

    it("start === end でも origin=destination エラーが発生しない URL 形式になる", () => {
      // Given: 周回ルート
      const mid1: Coordinate = { lat: 35.685, lng: 139.770 };
      const mid2: Coordinate = { lat: 35.688, lng: 139.765 };
      const coords: Coordinate[] = [START, mid1, mid2, START];
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: coords },
        start: START,
        end: START,
      });
      // When
      const url = buildGoogleMapsUrl(route) ?? "";
      // Then: ?origin= ではなくパス形式
      expect(url).not.toContain("origin=");
      expect(url).not.toContain("destination=");
    });
  });

  describe("waypoints のサンプリング（座標数が多い場合）", () => {
    it("中間点が 9 点を超える場合はパスに含まれる経由点が 9 点以下になる", () => {
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
      const url = buildGoogleMapsUrl(route) ?? "";
      // パス部分（travelmode パラメータの前）を取得してスラッシュ区切りでカウント
      const pathPart = url.replace("https://www.google.com/maps/dir/", "").split("?")[0];
      const segments = pathPart.split("/");
      // start + 最大9中間点 + end = 最大11セグメント
      expect(segments.length).toBeLessThanOrEqual(11);
    });

    it("中間点が 9 点以下の場合は全点がパスに含まれる", () => {
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
      const url = buildGoogleMapsUrl(route) ?? "";
      const pathPart = url.replace("https://www.google.com/maps/dir/", "").split("?")[0];
      const segments = pathPart.split("/");
      // start + 5中間点 + end = 7セグメント
      expect(segments).toHaveLength(7);
    });
  });

  describe("2点のみの geometry（中間点なし）", () => {
    it("クエリパラメータ形式の URL が返る", () => {
      // Given: 中間点なし（start → end の2点のみ）
      const end: Coordinate = { lat: 35.700, lng: 139.780 };
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: [START, end] },
        start: START,
        end,
      });
      // When
      const url = buildGoogleMapsUrl(route) ?? "";
      // Then: クエリパラメータ形式
      expect(url).toContain("?api=1");
      expect(url).toContain("origin=");
      expect(url).toContain("destination=");
    });

    it("origin と destination に正しい座標が設定される", () => {
      // Given
      const end: Coordinate = { lat: 35.700, lng: 139.780 };
      const route = makeRoute({
        geometry: { type: "LineString", coordinates: [START, end] },
        start: START,
        end,
      });
      // When
      const url = decodeURIComponent(buildGoogleMapsUrl(route) ?? "");
      // Then
      expect(url).toContain(`origin=${START.lat},${START.lng}`);
      expect(url).toContain(`destination=${end.lat},${end.lng}`);
    });
  });
});
