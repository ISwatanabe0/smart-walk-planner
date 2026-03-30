import { renderHook, act } from "@testing-library/react";
import { useGoogleMapsLink } from "@/hooks/useGoogleMapsLink";
import type { WalkRoute } from "@/types/route";

// Google Maps URL ビルダーをモック
jest.mock("@/features/walk-planner/services/googleMapsLinkBuilder", () => ({
  buildGoogleMapsUrl: jest.fn(),
}));

import { buildGoogleMapsUrl } from "@/features/walk-planner/services/googleMapsLinkBuilder";

const mockBuildGoogleMapsUrl = buildGoogleMapsUrl as jest.MockedFunction<
  typeof buildGoogleMapsUrl
>;

const TEST_URL = "https://www.google.com/maps/dir/?api=1&origin=35.6812,139.7671&destination=35.6812,139.7671&travelmode=walking";

const mockRoute: WalkRoute = {
  routeId: "route-001",
  summary: {
    distanceMeters: 3000,
    estimatedMinutes: 40,
    sceneryScore: 80,
    trafficLightScore: 70,
    mainRoadAvoidanceScore: 85,
  },
  geometry: {
    type: "LineString",
    coordinates: [
      { lat: 35.6812, lng: 139.7671 },
      { lat: 35.685, lng: 139.77 },
    ],
  },
  start: { lat: 35.6812, lng: 139.7671 },
  end: { lat: 35.6812, lng: 139.7671 },
  waypoints: [],
  tags: [],
};

const mockWindowOpen = jest.fn();

beforeEach(() => {
  mockBuildGoogleMapsUrl.mockClear();
  mockWindowOpen.mockClear();
  Object.defineProperty(window, "open", { value: mockWindowOpen, writable: true });
});

describe("useGoogleMapsLink", () => {
  describe("初期状態", () => {
    it("route が null のとき googleMapsUrl は null である", () => {
      // Given: ルート未選択
      mockBuildGoogleMapsUrl.mockReturnValue(null);
      // When
      const { result } = renderHook(() => useGoogleMapsLink(null));
      // Then
      expect(result.current.googleMapsUrl).toBeNull();
    });

    it("isConfirmDialogOpen は false で初期化される", () => {
      // Given: ルート未選択
      mockBuildGoogleMapsUrl.mockReturnValue(null);
      // When
      const { result } = renderHook(() => useGoogleMapsLink(null));
      // Then
      expect(result.current.isConfirmDialogOpen).toBe(false);
    });

    it("ルートが存在するとき googleMapsUrl が生成される", () => {
      // Given: 選択済みルート
      mockBuildGoogleMapsUrl.mockReturnValue(TEST_URL);
      // When
      const { result } = renderHook(() => useGoogleMapsLink(mockRoute));
      // Then
      expect(result.current.googleMapsUrl).toBe(TEST_URL);
    });
  });

  describe("openConfirmDialog", () => {
    it("googleMapsUrl が null のとき、ダイアログは開かない", () => {
      // Given: URL未生成状態
      mockBuildGoogleMapsUrl.mockReturnValue(null);
      const { result } = renderHook(() => useGoogleMapsLink(null));
      // When
      act(() => {
        result.current.openConfirmDialog();
      });
      // Then: ダイアログは閉じたまま
      expect(result.current.isConfirmDialogOpen).toBe(false);
    });

    it("googleMapsUrl が設定されているとき、ダイアログが開く", () => {
      // Given: URL生成済み状態
      mockBuildGoogleMapsUrl.mockReturnValue(TEST_URL);
      const { result } = renderHook(() => useGoogleMapsLink(mockRoute));
      // When
      act(() => {
        result.current.openConfirmDialog();
      });
      // Then
      expect(result.current.isConfirmDialogOpen).toBe(true);
    });
  });

  describe("closeConfirmDialog", () => {
    it("開いているダイアログを閉じる", () => {
      // Given: ダイアログが開いている状態
      mockBuildGoogleMapsUrl.mockReturnValue(TEST_URL);
      const { result } = renderHook(() => useGoogleMapsLink(mockRoute));
      act(() => {
        result.current.openConfirmDialog();
      });
      expect(result.current.isConfirmDialogOpen).toBe(true);
      // When
      act(() => {
        result.current.closeConfirmDialog();
      });
      // Then
      expect(result.current.isConfirmDialogOpen).toBe(false);
    });
  });

  describe("confirmAndNavigate", () => {
    it("ダイアログを閉じて window.open を '_blank' で呼び出す", () => {
      // Given: ダイアログが開いている状態
      mockBuildGoogleMapsUrl.mockReturnValue(TEST_URL);
      const { result } = renderHook(() => useGoogleMapsLink(mockRoute));
      act(() => {
        result.current.openConfirmDialog();
      });
      // When
      act(() => {
        result.current.confirmAndNavigate();
      });
      // Then: ダイアログが閉じ、URLが新しいタブで開かれる
      expect(result.current.isConfirmDialogOpen).toBe(false);
      expect(mockWindowOpen).toHaveBeenCalledWith(TEST_URL, "_blank");
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    });

    it("googleMapsUrl が null のとき window.open を呼び出さない", () => {
      // Given: URL未生成状態
      mockBuildGoogleMapsUrl.mockReturnValue(null);
      const { result } = renderHook(() => useGoogleMapsLink(null));
      // When
      act(() => {
        result.current.confirmAndNavigate();
      });
      // Then: window.open は呼ばれない
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });
});
