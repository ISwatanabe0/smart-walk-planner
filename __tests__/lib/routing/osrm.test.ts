import { fetchOsrmRoute } from "@/lib/routing/osrm";
import type { Coordinate } from "@/types/map";

const TOKYO: Coordinate = { lat: 35.6812, lng: 139.7671 };
const NEARBY: Coordinate = { lat: 35.6900, lng: 139.7750 };

const mockOsrmResponse = {
  code: "Ok",
  routes: [
    {
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [139.7671, 35.6812],
          [139.7750, 35.6900],
        ] as Array<[number, number]>,
      },
      distance: 1234.5,
      duration: 890.2,
    },
  ],
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe("fetchOsrmRoute", () => {
  describe("正常系", () => {
    it("2点を渡すと OsrmResult を返す", async () => {
      // Given: OSRM API が正常レスポンスを返す
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse,
      } as Response);
      // When
      const result = await fetchOsrmRoute([TOKYO, NEARBY]);
      // Then
      expect(result.coordinates).toEqual(mockOsrmResponse.routes[0].geometry.coordinates);
      expect(result.distanceMeters).toBe(1235); // Math.round(1234.5)
      expect(result.durationSeconds).toBe(890); // Math.round(890.2)
    });

    it("4点（周回ルート）を渡しても正常に動作する", async () => {
      // Given
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse,
      } as Response);
      const wp1: Coordinate = { lat: 35.685, lng: 139.770 };
      const wp2: Coordinate = { lat: 35.688, lng: 139.765 };
      // When
      const result = await fetchOsrmRoute([TOKYO, wp1, wp2, TOKYO]);
      // Then: 正常にレスポンスが返る
      expect(result.distanceMeters).toBeGreaterThan(0);
    });

    it("distanceMeters と durationSeconds は整数値に丸められる", async () => {
      // Given: 小数点を含む distance/duration
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockOsrmResponse,
          routes: [{ ...mockOsrmResponse.routes[0], distance: 999.9, duration: 600.1 }],
        }),
      } as Response);
      // When
      const result = await fetchOsrmRoute([TOKYO, NEARBY]);
      // Then
      expect(Number.isInteger(result.distanceMeters)).toBe(true);
      expect(Number.isInteger(result.durationSeconds)).toBe(true);
      expect(result.distanceMeters).toBe(1000);
      expect(result.durationSeconds).toBe(600);
    });

    it("リクエストURLに経由点の座標が含まれる", async () => {
      // Given
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse,
      } as Response);
      global.fetch = fetchMock;
      // When
      await fetchOsrmRoute([TOKYO, NEARBY]);
      // Then: URL に lng,lat 形式で座標が含まれる
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain(`${TOKYO.lng},${TOKYO.lat}`);
      expect(calledUrl).toContain(`${NEARBY.lng},${NEARBY.lat}`);
    });

    it("リクエストに geometries=geojson と overview=full が含まれる", async () => {
      // Given
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse,
      } as Response);
      global.fetch = fetchMock;
      // When
      await fetchOsrmRoute([TOKYO, NEARBY]);
      // Then
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("geometries=geojson");
      expect(calledUrl).toContain("overview=full");
    });
  });

  describe("異常系", () => {
    it("経由点が1点の場合はエラーをスローする", async () => {
      // Given: 経由点が不足
      // When / Then
      await expect(fetchOsrmRoute([TOKYO])).rejects.toThrow("経由点は2点以上必要です");
    });

    it("経由点が0点の場合はエラーをスローする", async () => {
      // Given
      // When / Then
      await expect(fetchOsrmRoute([])).rejects.toThrow("経由点は2点以上必要です");
    });

    it("HTTP エラー時にエラーをスローする", async () => {
      // Given: HTTP 500 レスポンス
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);
      // When / Then
      await expect(fetchOsrmRoute([TOKYO, NEARBY])).rejects.toThrow("OSRM APIエラー: HTTP 500");
    });

    it("OSRM code が Ok でない場合にエラーをスローする", async () => {
      // Given: NoRoute レスポンス
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "NoRoute", routes: [] }),
      } as Response);
      // When / Then
      await expect(fetchOsrmRoute([TOKYO, NEARBY])).rejects.toThrow("OSRM ルート取得失敗: NoRoute");
    });

    it("routes が空配列の場合にエラーをスローする", async () => {
      // Given
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "Ok", routes: [] }),
      } as Response);
      // When / Then
      await expect(fetchOsrmRoute([TOKYO, NEARBY])).rejects.toThrow("OSRM ルート取得失敗");
    });

    it("fetch 自体が reject された場合にエラーが伝播する", async () => {
      // Given: ネットワークエラー
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      // When / Then
      await expect(fetchOsrmRoute([TOKYO, NEARBY])).rejects.toThrow("Network error");
    });
  });
});
