import {
  DEFAULT_DISTANCE_METERS,
  DEFAULT_CANDIDATE_COUNT,
  MIN_SEARCH_RADIUS_METERS,
  MAX_SEARCH_RADIUS_METERS,
} from "@/constants/defaultValues";

describe("defaultValues", () => {
  describe("DEFAULT_DISTANCE_METERS", () => {
    // ユーザー要件: デフォルト値は3000m
    it("3000 である", () => {
      expect(DEFAULT_DISTANCE_METERS).toBe(3000);
    });

    it("正の整数である", () => {
      expect(DEFAULT_DISTANCE_METERS).toBeGreaterThan(0);
      expect(Number.isInteger(DEFAULT_DISTANCE_METERS)).toBe(true);
    });
  });

  describe("DEFAULT_CANDIDATE_COUNT", () => {
    it("正の整数である", () => {
      expect(DEFAULT_CANDIDATE_COUNT).toBeGreaterThan(0);
      expect(Number.isInteger(DEFAULT_CANDIDATE_COUNT)).toBe(true);
    });
  });

  describe("探索半径の上下限", () => {
    it("MIN_SEARCH_RADIUS_METERS は正の値である", () => {
      expect(MIN_SEARCH_RADIUS_METERS).toBeGreaterThan(0);
    });

    it("MAX_SEARCH_RADIUS_METERS は MIN_SEARCH_RADIUS_METERS より大きい", () => {
      expect(MAX_SEARCH_RADIUS_METERS).toBeGreaterThan(MIN_SEARCH_RADIUS_METERS);
    });
  });
});
