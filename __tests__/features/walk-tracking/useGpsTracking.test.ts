import { renderHook, act } from "@testing-library/react";
import { useGpsTracking } from "@/features/walk-tracking/hooks/useGpsTracking";

type SuccessCb = (pos: GeolocationPosition) => void;
type ErrorCb = (err: GeolocationPositionError) => void;

let successCb: SuccessCb | null = null;
let errorCb: ErrorCb | null = null;

const watchPositionMock = jest.fn(
  (success: SuccessCb, error: ErrorCb): number => {
    successCb = success;
    errorCb = error;
    return 1;
  }
);
const clearWatchMock = jest.fn();

function makePosition(
  lat: number,
  lng: number,
  accuracy = 10
): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

const TOKYO = { lat: 35.6812, lng: 139.7671 };

beforeEach(() => {
  successCb = null;
  errorCb = null;
  watchPositionMock.mockClear();
  clearWatchMock.mockClear();
  Object.defineProperty(global.navigator, "geolocation", {
    configurable: true,
    value: {
      watchPosition: watchPositionMock,
      clearWatch: clearWatchMock,
    },
  });
});

describe("useGpsTracking", () => {
  describe("初期状態", () => {
    it("トラッキングしておらず、軌跡・距離が空である", () => {
      // Given / When
      const { result } = renderHook(() => useGpsTracking());
      // Then
      expect(result.current.isTracking).toBe(false);
      expect(result.current.currentPosition).toBeNull();
      expect(result.current.trail).toEqual([]);
      expect(result.current.walkedMeters).toBe(0);
      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe("startTracking", () => {
    it("watchPosition を呼び、isTracking が true になる", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      // When
      act(() => result.current.startTracking());
      // Then
      expect(result.current.isTracking).toBe(true);
      expect(watchPositionMock).toHaveBeenCalledTimes(1);
    });

    it("最初の測位で現在地が設定され、軌跡に1点追加される", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      act(() => result.current.startTracking());
      // When: 良好な精度の測位
      act(() => successCb?.(makePosition(TOKYO.lat, TOKYO.lng, 10)));
      // Then
      expect(result.current.currentPosition).toEqual(TOKYO);
      expect(result.current.trail).toHaveLength(1);
      expect(result.current.walkedMeters).toBe(0);
    });

    it("十分に移動すると軌跡が伸び、歩行距離が加算される", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      act(() => result.current.startTracking());
      act(() => successCb?.(makePosition(TOKYO.lat, TOKYO.lng, 10)));
      // When: 約100m北へ移動（0.0009°≒100m）
      act(() =>
        successCb?.(makePosition(TOKYO.lat + 0.0009, TOKYO.lng, 10))
      );
      // Then
      expect(result.current.trail).toHaveLength(2);
      expect(result.current.walkedMeters).toBeGreaterThan(90);
      expect(result.current.walkedMeters).toBeLessThan(110);
    });

    it("わずかな移動（5m未満）はノイズとして無視される", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      act(() => result.current.startTracking());
      act(() => successCb?.(makePosition(TOKYO.lat, TOKYO.lng, 10)));
      // When: 約1mのゆらぎ
      act(() =>
        successCb?.(makePosition(TOKYO.lat + 0.00001, TOKYO.lng, 10))
      );
      // Then: 軌跡・距離は変化しない
      expect(result.current.trail).toHaveLength(1);
      expect(result.current.walkedMeters).toBe(0);
    });

    it("精度が悪い測位は現在地に反映するが軌跡には加えない", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      act(() => result.current.startTracking());
      // When: 精度60m（閾値50m超）
      act(() => successCb?.(makePosition(TOKYO.lat, TOKYO.lng, 60)));
      // Then
      expect(result.current.currentPosition).toEqual(TOKYO);
      expect(result.current.accuracyMeters).toBe(60);
      expect(result.current.trail).toHaveLength(0);
    });
  });

  describe("経過時間", () => {
    it("タイマーで elapsedSeconds が増加する", () => {
      // Given
      jest.useFakeTimers();
      try {
        const { result } = renderHook(() => useGpsTracking());
        act(() => result.current.startTracking());
        // When: 3秒経過
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        // Then
        expect(result.current.elapsedSeconds).toBe(3);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("stopTracking", () => {
    it("clearWatch を呼び、isTracking が false になる", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      act(() => result.current.startTracking());
      // When
      act(() => result.current.stopTracking());
      // Then
      expect(clearWatchMock).toHaveBeenCalledWith(1);
      expect(result.current.isTracking).toBe(false);
    });
  });

  describe("エラー処理", () => {
    it("位置情報の許可拒否時にエラーメッセージを設定する", () => {
      // Given
      const { result } = renderHook(() => useGpsTracking());
      act(() => result.current.startTracking());
      // When: PERMISSION_DENIED (code 1)
      act(() =>
        errorCb?.({
          code: 1,
          message: "denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError)
      );
      // Then
      expect(result.current.error).toContain("許可");
    });
  });
});
