/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/routes/generate/route";

// fetchOsrmRoute をモック
jest.mock("@/lib/routing/osrm", () => ({
  fetchOsrmRoute: jest.fn(),
}));

import { fetchOsrmRoute } from "@/lib/routing/osrm";

const mockFetchOsrmRoute = fetchOsrmRoute as jest.MockedFunction<typeof fetchOsrmRoute>;

const mockOsrmResult = {
  coordinates: [
    [139.7671, 35.6812],
    [139.7750, 35.6900],
    [139.7671, 35.6812],
  ] as Array<[number, number]>,
  distanceMeters: 3200,
  // 公開OSRMの duration は車速ベース（短すぎる）想定の値。
  // 所要時間がこの値からではなく距離から計算されることを検証する
  durationSeconds: 600,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/routes/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockFetchOsrmRoute.mockReset();
  mockFetchOsrmRoute.mockResolvedValue(mockOsrmResult);
});

describe("POST /api/routes/generate", () => {
  describe("正常系", () => {
    it("有効なリクエストで success: true とルート配列を返す", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.routes)).toBe(true);
      expect(body.data.routes.length).toBeGreaterThan(0);
    });

    it("デフォルト candidateCount (3) の場合、3つのルートを返す", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then: candidateCount 未指定時はデフォルト3候補
      expect(body.data.routes).toHaveLength(3);
    });

    it("candidateCount: 1 を指定すると1つのルートを返す", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        options: { candidateCount: 1 },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes).toHaveLength(1);
    });

    it("candidateCount が 5 を超えても最大5ルートに制限される", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        options: { candidateCount: 10 },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then: CANDIDATE_BASE_BEARINGS は3要素なので3が上限
      expect(body.data.routes.length).toBeLessThanOrEqual(3);
    });

    it("各ルートに routeId, summary, geometry, tags が含まれる", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      const route = body.data.routes[0];
      expect(route.routeId).toBeDefined();
      expect(route.summary).toBeDefined();
      expect(route.geometry).toBeDefined();
      expect(Array.isArray(route.tags)).toBe(true);
    });

    it("summary に distanceMeters と estimatedMinutes が含まれる", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      const summary = body.data.routes[0].summary;
      expect(typeof summary.distanceMeters).toBe("number");
      expect(typeof summary.estimatedMinutes).toBe("number");
    });

    it("geometry に OSRM の座標配列が設定される", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].geometry.type).toBe("LineString");
      expect(body.data.routes[0].geometry.coordinates).toEqual(mockOsrmResult.coordinates);
    });

    it("searchArea に radiusMeters が含まれる", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 }, distanceMeters: 3000 });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(typeof body.data.searchArea.radiusMeters).toBe("number");
      expect(body.data.searchArea.radiusMeters).toBeGreaterThan(0);
    });
  });

  describe("preferences → tags の変換", () => {
    it("preferences.scenery: true のとき tags に '景観重視' が含まれる", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        preferences: { scenery: true },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("景観重視");
    });

    it("preferences.avoidTrafficLights: true のとき tags に '信号少なめ' が含まれる", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        preferences: { avoidTrafficLights: true },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("信号少なめ");
    });

    it("preferences.avoidMainRoads: true のとき tags に '大通り回避' が含まれる", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        preferences: { avoidMainRoads: true },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("大通り回避");
    });

    it("preferences.includeSightseeing: true のとき tags に '観光名所あり' が含まれる", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        preferences: { includeSightseeing: true },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("観光名所あり");
    });

    it("routeType 未指定（周回）のとき tags に '周回ルート' が含まれる", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("周回ルート");
    });

    it("routeType: 'oneway' のとき tags に '片道ルート' が含まれる", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        end: { lat: 35.7, lng: 139.78 },
        routeType: "oneway",
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("片道ルート");
      expect(body.data.routes[0].tags).not.toContain("周回ルート");
    });

    it("preferences が全て false のとき tags はルートタイプのみ", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        preferences: {
          scenery: false,
          avoidTrafficLights: false,
          avoidMainRoads: false,
          includeSightseeing: false,
        },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toEqual(["周回ルート"]);
    });

    it("複数の preferences が true のとき対応する全 tags が含まれる", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        preferences: { scenery: true, avoidMainRoads: true },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(body.data.routes[0].tags).toContain("景観重視");
      expect(body.data.routes[0].tags).toContain("大通り回避");
    });
  });

  describe("推定所要時間", () => {
    it("estimatedMinutes は徒歩速度（80m/分）で距離から計算される", async () => {
      // Given: OSRM の距離 3200m / duration 600秒（車速ベースの値）
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then: 3200m ÷ 80m/分 = 40分（OSRM duration の 600秒=10分 ではない）
      expect(body.data.routes[0].summary.estimatedMinutes).toBe(40);
    });
  });

  describe("片道ルート", () => {
    const onewayBody = {
      start: { lat: 35.6812, lng: 139.7671 },
      end: { lat: 35.7, lng: 139.78 },
      routeType: "oneway",
    };

    it("有効なリクエストで3候補のルートを返す", async () => {
      // Given
      const req = makeRequest(onewayBody);
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(200);
      expect(body.data.routes).toHaveLength(3);
    });

    it("各候補の経由点は start で始まり end で終わる", async () => {
      // Given
      const req = makeRequest(onewayBody);
      // When
      await POST(req);
      // Then: OSRM への全リクエストが start → ... → end の形
      expect(mockFetchOsrmRoute).toHaveBeenCalledTimes(3);
      mockFetchOsrmRoute.mock.calls.forEach(([waypoints]) => {
        expect(waypoints[0]).toEqual(onewayBody.start);
        expect(waypoints[waypoints.length - 1]).toEqual(onewayBody.end);
      });
    });

    it("1候補目は直行、2・3候補目は迂回経由点を含む", async () => {
      // Given
      const req = makeRequest(onewayBody);
      // When
      await POST(req);
      // Then
      const calls = mockFetchOsrmRoute.mock.calls;
      expect(calls[0][0]).toHaveLength(2);
      expect(calls[1][0]).toHaveLength(3);
      expect(calls[2][0]).toHaveLength(3);
    });

    it("routeType: 'oneway' で end がない場合は 400 を返す", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        routeType: "oneway",
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_PARAMETER");
    });

    it("routeType: 'loop' なら end がなくても成功する", async () => {
      // Given
      const req = makeRequest({
        start: { lat: 35.6812, lng: 139.7671 },
        routeType: "loop",
      });
      // When
      const res = await POST(req);
      // Then
      expect(res.status).toBe(200);
    });
  });

  describe("異常系", () => {
    it("start がない場合は 400 を返す", async () => {
      // Given
      const req = makeRequest({ distanceMeters: 3000 });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_PARAMETER");
    });

    it("start.lat が文字列の場合は 400 を返す", async () => {
      // Given
      const req = makeRequest({ start: { lat: "35.68", lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it("start.lng が欠落している場合は 400 を返す", async () => {
      // Given
      const req = makeRequest({ start: { lat: 35.6812 } });
      // When
      const res = await POST(req);
      // Then
      expect(res.status).toBe(400);
    });

    it("不正な JSON の場合は 400 を返す", async () => {
      // Given: JSON.parse に失敗するボディ
      const req = new NextRequest("http://localhost/api/routes/generate", {
        method: "POST",
        body: "{ invalid json",
        headers: { "Content-Type": "application/json" },
      });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_PARAMETER");
    });

    it("OSRM がエラーを返した場合は 502 を返す", async () => {
      // Given: OSRM API が失敗
      mockFetchOsrmRoute.mockRejectedValue(new Error("OSRM APIエラー: HTTP 503"));
      const req = makeRequest({ start: { lat: 35.6812, lng: 139.7671 } });
      // When
      const res = await POST(req);
      const body = await res.json();
      // Then
      expect(res.status).toBe(502);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("ROUTE_GENERATION_FAILED");
      expect(body.error.message).toContain("OSRM APIエラー");
    });
  });
});
