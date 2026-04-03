import { destinationPoint, haversineDistance } from "@/lib/geo/destination";
import type { Coordinate } from "@/types/map";

const TOKYO: Coordinate = { lat: 35.6812, lng: 139.7671 };

describe("destinationPoint", () => {
  describe("方位による移動方向", () => {
    it("北(0°)に移動すると lat が増加する", () => {
      // Given: 東京を起点に北へ1000m
      // When
      const result = destinationPoint(TOKYO, 0, 1000);
      // Then: 緯度が増加し、経度はほぼ変わらない
      expect(result.lat).toBeGreaterThan(TOKYO.lat);
      expect(result.lng).toBeCloseTo(TOKYO.lng, 4);
    });

    it("南(180°)に移動すると lat が減少する", () => {
      // Given
      // When
      const result = destinationPoint(TOKYO, 180, 1000);
      // Then
      expect(result.lat).toBeLessThan(TOKYO.lat);
      expect(result.lng).toBeCloseTo(TOKYO.lng, 4);
    });

    it("東(90°)に移動すると lng が増加する", () => {
      // Given
      // When
      const result = destinationPoint(TOKYO, 90, 1000);
      // Then
      expect(result.lng).toBeGreaterThan(TOKYO.lng);
      expect(result.lat).toBeCloseTo(TOKYO.lat, 4);
    });

    it("西(270°)に移動すると lng が減少する", () => {
      // Given
      // When
      const result = destinationPoint(TOKYO, 270, 1000);
      // Then
      expect(result.lng).toBeLessThan(TOKYO.lng);
      expect(result.lat).toBeCloseTo(TOKYO.lat, 4);
    });
  });

  describe("距離の妥当性", () => {
    it("北へ1000m移動した地点は出発点から約1000m離れている", () => {
      // Given
      const result = destinationPoint(TOKYO, 0, 1000);
      // When: 逆検証としてHaversine距離を計算
      const dist = haversineDistance(TOKYO, result);
      // Then: 誤差1m以内
      expect(dist).toBeCloseTo(1000, 0);
    });

    it("半径2000mで各方向に移動した地点は出発点から約2000m離れている", () => {
      // Given: 4方向で確認
      const bearings = [0, 90, 180, 270];
      bearings.forEach((bearing) => {
        // When
        const result = destinationPoint(TOKYO, bearing, 2000);
        const dist = haversineDistance(TOKYO, result);
        // Then
        expect(dist).toBeCloseTo(2000, 0);
      });
    });

    it("距離0の場合は出発点と同じ座標を返す", () => {
      // Given
      // When
      const result = destinationPoint(TOKYO, 45, 0);
      // Then
      expect(result.lat).toBeCloseTo(TOKYO.lat, 5);
      expect(result.lng).toBeCloseTo(TOKYO.lng, 5);
    });
  });

  describe("三角形ルートの経由点配置", () => {
    it("120°間隔の2点はどちらも出発点から等距離にある", () => {
      // Given: ルート生成ロジックに合わせて120°間隔で2点を配置
      const radius = 500;
      const wp1 = destinationPoint(TOKYO, 0, radius);
      const wp2 = destinationPoint(TOKYO, 120, radius);
      // When
      const dist1 = haversineDistance(TOKYO, wp1);
      const dist2 = haversineDistance(TOKYO, wp2);
      // Then: 両方とも radius に近い
      expect(dist1).toBeCloseTo(radius, 0);
      expect(dist2).toBeCloseTo(radius, 0);
    });
  });
});

describe("haversineDistance", () => {
  describe("正常系", () => {
    it("同一座標の距離は0", () => {
      // Given
      // When
      const dist = haversineDistance(TOKYO, TOKYO);
      // Then
      expect(dist).toBe(0);
    });

    it("距離は対称的（A→B = B→A）", () => {
      // Given
      const sapporo: Coordinate = { lat: 43.0618, lng: 141.3545 };
      // When
      const distAtoB = haversineDistance(TOKYO, sapporo);
      const distBtoA = haversineDistance(sapporo, TOKYO);
      // Then
      expect(distAtoB).toBeCloseTo(distBtoA, 0);
    });

    it("東京〜札幌間は約830,000m（830km）", () => {
      // Given
      const sapporo: Coordinate = { lat: 43.0618, lng: 141.3545 };
      // When
      const dist = haversineDistance(TOKYO, sapporo);
      // Then: 5km の許容誤差（直線距離の概算）
      expect(dist).toBeGreaterThan(825000);
      expect(dist).toBeLessThan(835000);
    });

    it("北へ111mの点との距離は約111m（1度≒111kmの1/1000）", () => {
      // Given: 緯度を約0.001°（≒111m）北にずらした点
      const nearby: Coordinate = { lat: TOKYO.lat + 0.001, lng: TOKYO.lng };
      // When
      const dist = haversineDistance(TOKYO, nearby);
      // Then: 約111m（10m 許容）
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(120);
    });
  });

  describe("destinationPoint との整合性", () => {
    it("destinationPoint で生成した座標との距離が指定距離と一致する", () => {
      // Given: 様々な方位・距離で検証
      const cases = [
        { bearing: 30, distance: 500 },
        { bearing: 120, distance: 1500 },
        { bearing: 240, distance: 3000 },
        { bearing: 330, distance: 800 },
      ];
      cases.forEach(({ bearing, distance }) => {
        // When
        const dest = destinationPoint(TOKYO, bearing, distance);
        const measured = haversineDistance(TOKYO, dest);
        // Then: 誤差1m以内
        expect(measured).toBeCloseTo(distance, 0);
      });
    });
  });
});
