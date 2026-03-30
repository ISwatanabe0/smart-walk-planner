import { validateRouteSearchCondition } from "@/features/route-search/validators/routeSearchValidator";
import type { RouteSearchCondition } from "@/types/preferences";
import { DEFAULT_DISTANCE_METERS } from "@/constants/defaultValues";

const validCondition: RouteSearchCondition = {
  start: { lat: 35.6812, lng: 139.7671 },
  distanceMeters: DEFAULT_DISTANCE_METERS,
  durationMinutes: null,
  preferences: {
    scenery: false,
    avoidTrafficLights: false,
    avoidMainRoads: false,
    includeSightseeing: false,
    loopRoute: false,
  },
};

describe("validateRouteSearchCondition", () => {
  describe("正常系", () => {
    it("全フィールドが有効な場合はエラーが空配列である", () => {
      // Given: 有効なルート検索条件
      // When: バリデーション実行
      const errors = validateRouteSearchCondition(validCondition);
      // Then: エラーなし
      expect(errors).toHaveLength(0);
    });

    it("durationMinutes が null でもエラーにならない", () => {
      // Given: durationMinutes がオプションとして null
      const condition: RouteSearchCondition = { ...validCondition, durationMinutes: null };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then: durationMinutes に関するエラーなし
      const durationError = errors.find((e) => e.field === "durationMinutes");
      expect(durationError).toBeUndefined();
    });

    it("distanceMeters が DEFAULT_DISTANCE_METERS (3000) の場合はエラーなし", () => {
      // Given: デフォルト値の3000m
      const condition: RouteSearchCondition = {
        ...validCondition,
        distanceMeters: DEFAULT_DISTANCE_METERS,
      };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then
      const distanceError = errors.find((e) => e.field === "distanceMeters");
      expect(distanceError).toBeUndefined();
    });
  });

  describe("start フィールド", () => {
    it("start が null の場合はエラーを返す", () => {
      // Given: 出発地点未設定
      const condition: RouteSearchCondition = { ...validCondition, start: null };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then: start フィールドのエラーが存在する
      const startError = errors.find((e) => e.field === "start");
      expect(startError).toBeDefined();
      expect(startError?.message).toBeTruthy();
    });

    it("有効な座標が指定された場合は start のエラーがない", () => {
      // Given: 有効な座標（東京）
      const condition: RouteSearchCondition = {
        ...validCondition,
        start: { lat: 35.6812, lng: 139.7671 },
      };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then
      const startError = errors.find((e) => e.field === "start");
      expect(startError).toBeUndefined();
    });

    it("有効な座標（札幌）の場合もエラーなし", () => {
      // Given: 異なる地点の座標
      const condition: RouteSearchCondition = {
        ...validCondition,
        start: { lat: 43.0618, lng: 141.3545 },
      };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then
      const startError = errors.find((e) => e.field === "start");
      expect(startError).toBeUndefined();
    });
  });

  describe("distanceMeters フィールド", () => {
    it("distanceMeters が 0 の場合はエラーを返す（境界値）", () => {
      // Given: 0m（無効値）
      const condition: RouteSearchCondition = { ...validCondition, distanceMeters: 0 };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then
      const distanceError = errors.find((e) => e.field === "distanceMeters");
      expect(distanceError).toBeDefined();
    });

    it("distanceMeters が 1 の場合はエラーなし（境界値）", () => {
      // Given: 最小有効値
      const condition: RouteSearchCondition = { ...validCondition, distanceMeters: 1 };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then
      const distanceError = errors.find((e) => e.field === "distanceMeters");
      expect(distanceError).toBeUndefined();
    });

    it("distanceMeters が負の値の場合はエラーを返す", () => {
      // Given: 負の値（無効）
      const condition: RouteSearchCondition = { ...validCondition, distanceMeters: -100 };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then
      const distanceError = errors.find((e) => e.field === "distanceMeters");
      expect(distanceError).toBeDefined();
    });
  });

  describe("startLocationText フィールドは存在しない", () => {
    it("RouteSearchCondition に startLocationText プロパティが含まれない", () => {
      // Given: 設計変更後の型
      // When: 実行時プロパティ確認
      // Then: startLocationText は型定義から削除済み
      expect("startLocationText" in validCondition).toBe(false);
    });
  });

  describe("ValidationError の構造", () => {
    it("エラーは field と message プロパティを持つ", () => {
      // Given: start が null（エラーが発生する条件）
      const condition: RouteSearchCondition = { ...validCondition, start: null };
      // When
      const errors = validateRouteSearchCondition(condition);
      // Then: エラーオブジェクトの構造確認
      expect(errors.length).toBeGreaterThan(0);
      errors.forEach((error) => {
        expect(typeof error.field).toBe("string");
        expect(typeof error.message).toBe("string");
        expect(error.field.length).toBeGreaterThan(0);
        expect(error.message.length).toBeGreaterThan(0);
      });
    });
  });
});
