import { renderHook, act } from "@testing-library/react";
import { useRouteSearch } from "@/features/route-search/hooks/useRouteSearch";
import { searchRoutes } from "@/features/route-search/services/routeSearchService";
import { DEFAULT_DISTANCE_METERS } from "@/constants/defaultValues";
import type { Coordinate } from "@/types/map";
import type { WalkRoute } from "@/types/route";

// ルート検索サービスをモック
jest.mock("@/features/route-search/services/routeSearchService", () => ({
  searchRoutes: jest.fn().mockResolvedValue([]),
}));

const mockSearchRoutes = searchRoutes as jest.MockedFunction<typeof searchRoutes>;

describe("useRouteSearch", () => {
  describe("初期状態", () => {
    it("distanceMeters が DEFAULT_DISTANCE_METERS (3000) で初期化される", () => {
      // Given: フック初期化
      // When
      const { result } = renderHook(() => useRouteSearch());
      // Then: デフォルト値が3000m
      expect(result.current.condition.distanceMeters).toBe(DEFAULT_DISTANCE_METERS);
      expect(result.current.condition.distanceMeters).toBe(3000);
    });

    it("start が null で初期化される", () => {
      // Given
      // When
      const { result } = renderHook(() => useRouteSearch());
      // Then: 出発地点は未設定
      expect(result.current.condition.start).toBeNull();
    });

    it("durationMinutes が null で初期化される", () => {
      // Given
      // When
      const { result } = renderHook(() => useRouteSearch());
      // Then: 時間はオプションとして null 許容
      expect(result.current.condition.durationMinutes).toBeNull();
    });

    it("preferences の全フラグが false で初期化される", () => {
      // Given
      // When
      const { result } = renderHook(() => useRouteSearch());
      const { preferences } = result.current.condition;
      // Then
      expect(preferences.scenery).toBe(false);
      expect(preferences.avoidTrafficLights).toBe(false);
      expect(preferences.avoidMainRoads).toBe(false);
      expect(preferences.includeSightseeing).toBe(false);
      expect(preferences.loopRoute).toBe(false);
    });

    it("isLoading が false で初期化される", () => {
      // Given
      // When
      const { result } = renderHook(() => useRouteSearch());
      // Then
      expect(result.current.isLoading).toBe(false);
    });

    it("errors が空配列で初期化される", () => {
      // Given
      // When
      const { result } = renderHook(() => useRouteSearch());
      // Then
      expect(result.current.errors).toHaveLength(0);
    });

    it("condition に startLocationText プロパティが存在しない", () => {
      // Given: 型変更後（座標入力のみ）
      // When
      const { result } = renderHook(() => useRouteSearch());
      // Then: startLocationText フィールドは削除済み
      expect("startLocationText" in result.current.condition).toBe(false);
    });
  });

  describe("updateCondition", () => {
    it("start を更新できる", () => {
      // Given: 初期状態
      const { result } = renderHook(() => useRouteSearch());
      const newStart: Coordinate = { lat: 35.6812, lng: 139.7671 };
      // When
      act(() => {
        result.current.updateCondition({ start: newStart });
      });
      // Then
      expect(result.current.condition.start).toEqual(newStart);
    });

    it("distanceMeters を更新できる", () => {
      // Given: 初期状態（3000m）
      const { result } = renderHook(() => useRouteSearch());
      // When
      act(() => {
        result.current.updateCondition({ distanceMeters: 5000 });
      });
      // Then
      expect(result.current.condition.distanceMeters).toBe(5000);
    });

    it("preferences の一部を更新しても他の preferences は変わらない", () => {
      // Given: 初期状態
      const { result } = renderHook(() => useRouteSearch());
      // When: scenery のみ変更
      act(() => {
        result.current.updateCondition({
          preferences: { ...result.current.condition.preferences, scenery: true },
        });
      });
      // Then: scenery のみ true、他は false
      expect(result.current.condition.preferences.scenery).toBe(true);
      expect(result.current.condition.preferences.avoidTrafficLights).toBe(false);
      expect(result.current.condition.preferences.avoidMainRoads).toBe(false);
    });
  });

  describe("submitSearch", () => {
    const validStart: Coordinate = { lat: 35.6812, lng: 139.7671 };

    beforeEach(() => {
      mockSearchRoutes.mockClear();
    });

    it("バリデーションエラー時に errors がセットされ searchRoutes が呼ばれない", async () => {
      // Given: start が null（バリデーションエラー）
      const { result } = renderHook(() => useRouteSearch());
      // When
      await act(async () => {
        await result.current.submitSearch();
      });
      // Then: エラーがセットされ、API は呼ばれない
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].field).toBe("start");
      expect(mockSearchRoutes).not.toHaveBeenCalled();
    });

    it("成功時に isLoading が true→false と遷移し結果が返る", async () => {
      // Given: 有効な条件
      const mockRoutes: WalkRoute[] = [
        {
          routeId: "route-001",
          summary: {
            distanceMeters: 3000,
            estimatedMinutes: 40,
            sceneryScore: 80,
            trafficLightScore: 70,
            mainRoadAvoidanceScore: 85,
          },
          geometry: { type: "LineString", coordinates: [validStart] },
          start: validStart,
          end: validStart,
          waypoints: [],
          tags: [],
        },
      ];
      mockSearchRoutes.mockResolvedValueOnce(mockRoutes);
      const { result } = renderHook(() => useRouteSearch());
      act(() => {
        result.current.updateCondition({ start: validStart });
      });
      // When
      let returned: WalkRoute[] = [];
      await act(async () => {
        returned = await result.current.submitSearch();
      });
      // Then: isLoading は false に戻り、結果が返る
      expect(result.current.isLoading).toBe(false);
      expect(returned).toEqual(mockRoutes);
      expect(mockSearchRoutes).toHaveBeenCalledTimes(1);
    });

    it("searchRoutes がスローした場合に isLoading が false に戻る", async () => {
      // Given: 有効な条件、API がエラーを返す
      mockSearchRoutes.mockRejectedValueOnce(new Error("ルート検索に失敗しました"));
      const { result } = renderHook(() => useRouteSearch());
      act(() => {
        result.current.updateCondition({ start: validStart });
      });
      // When
      await act(async () => {
        await expect(result.current.submitSearch()).rejects.toThrow("ルート検索に失敗しました");
      });
      // Then: isLoading は false に戻る
      expect(result.current.isLoading).toBe(false);
    });
  });
});
