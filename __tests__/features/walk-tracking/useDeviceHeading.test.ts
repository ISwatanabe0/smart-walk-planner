import { renderHook, act } from "@testing-library/react";
import { useDeviceHeading } from "@/features/walk-tracking/hooks/useDeviceHeading";

// jsdom には DeviceOrientationEvent が無いため、許可不要な端末（Android相当）を模擬する
beforeEach(() => {
  (window as unknown as { DeviceOrientationEvent: unknown }).DeviceOrientationEvent =
    class {};
});

afterEach(() => {
  delete (window as unknown as { DeviceOrientationEvent?: unknown })
    .DeviceOrientationEvent;
});

function dispatchOrientation(props: {
  webkitCompassHeading?: number;
  alpha?: number | null;
  absolute?: boolean;
}) {
  const event = new Event("deviceorientation") as DeviceOrientationEvent &
    Record<string, unknown>;
  Object.assign(event, {
    alpha: props.alpha ?? null,
    beta: null,
    gamma: null,
    absolute: props.absolute ?? false,
    webkitCompassHeading: props.webkitCompassHeading,
  });
  window.dispatchEvent(event);
}

describe("useDeviceHeading", () => {
  it("初期状態は heading=null・permission=unknown", () => {
    const { result } = renderHook(() => useDeviceHeading());
    expect(result.current.heading).toBeNull();
    expect(result.current.permission).toBe("unknown");
  });

  it("requestPermission（Android想定: requestPermission未実装）で granted になり購読する", async () => {
    const { result } = renderHook(() => useDeviceHeading());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permission).toBe("granted");
  });

  it("iOSのwebkitCompassHeadingから方位を取得する", async () => {
    const { result } = renderHook(() => useDeviceHeading());
    await act(async () => {
      await result.current.requestPermission();
    });
    act(() => {
      dispatchOrientation({ webkitCompassHeading: 90 });
    });
    // 最初の値はそのまま採用される（平滑化の初期値）
    expect(result.current.heading).toBeCloseTo(90, 0);
  });

  it("Android absolute の alpha を方位（時計回り）へ変換する", async () => {
    const { result } = renderHook(() => useDeviceHeading());
    await act(async () => {
      await result.current.requestPermission();
    });
    act(() => {
      // alpha=90（反時計回り）→ 方位 270
      dispatchOrientation({ alpha: 90, absolute: true });
    });
    expect(result.current.heading).toBeCloseTo(270, 0);
  });

  it("方位が取れないイベントでは heading は更新されない", async () => {
    const { result } = renderHook(() => useDeviceHeading());
    await act(async () => {
      await result.current.requestPermission();
    });
    act(() => {
      dispatchOrientation({ alpha: null, absolute: false });
    });
    expect(result.current.heading).toBeNull();
  });
});
