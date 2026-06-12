import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackingPanel } from "@/features/walk-tracking/components/TrackingPanel";
import type { GpsTracking } from "@/features/walk-tracking/hooks/useGpsTracking";

const startTracking = jest.fn();
const stopTracking = jest.fn();

function makeTracking(overrides: Partial<GpsTracking> = {}): GpsTracking {
  return {
    isTracking: false,
    currentPosition: null,
    accuracyMeters: null,
    headingDeg: null,
    isMoving: false,
    trail: [],
    walkedMeters: 0,
    elapsedSeconds: 0,
    isScreenLockHeld: false,
    error: null,
    startTracking,
    stopTracking,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TrackingPanel", () => {
  describe("待機中（非トラッキング）", () => {
    it("スタートボタンが表示される", () => {
      // Given / When
      render(<TrackingPanel tracking={makeTracking()} />);
      // Then
      expect(
        screen.getByRole("button", { name: /スタート/ })
      ).toBeInTheDocument();
    });

    it("スタートボタンを押すと startTracking が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      render(<TrackingPanel tracking={makeTracking()} />);
      // When
      await user.click(screen.getByRole("button", { name: /スタート/ }));
      // Then
      expect(startTracking).toHaveBeenCalledTimes(1);
    });

    it("待機中は統計（歩行距離など）は表示されない", () => {
      // Given / When
      render(<TrackingPanel tracking={makeTracking()} />);
      // Then
      expect(screen.queryByText("歩行距離")).not.toBeInTheDocument();
    });
  });

  describe("トラッキング中", () => {
    const activeTracking = makeTracking({
      isTracking: true,
      walkedMeters: 1234,
      elapsedSeconds: 65,
      accuracyMeters: 12,
      isScreenLockHeld: true,
    });

    it("歩行距離と経過時間が整形されて表示される", () => {
      // Given / When
      render(<TrackingPanel tracking={activeTracking} />);
      // Then
      expect(screen.getByText("1.23km")).toBeInTheDocument();
      expect(screen.getByText("01:05")).toBeInTheDocument();
    });

    it("歩数と消費カロリーが表示される", () => {
      // Given: 1234m 歩行
      render(<TrackingPanel tracking={activeTracking} />);
      // Then: 歩数ラベルと消費kcalラベルが存在する
      expect(screen.getByText("歩数")).toBeInTheDocument();
      expect(screen.getByText("消費kcal")).toBeInTheDocument();
      // 1234m ÷ 0.7 ≒ 1763歩
      expect(screen.getByText("1,763")).toBeInTheDocument();
    });

    it("終了ボタンを押すと stopTracking が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      render(<TrackingPanel tracking={activeTracking} />);
      // When
      await user.click(screen.getByRole("button", { name: /終了/ }));
      // Then
      expect(stopTracking).toHaveBeenCalledTimes(1);
    });

    it("画面消灯防止が無効のとき注意文を表示する", () => {
      // Given: Wake Lock 未取得
      const tracking = makeTracking({
        isTracking: true,
        isScreenLockHeld: false,
      });
      // When
      render(<TrackingPanel tracking={tracking} />);
      // Then
      expect(screen.getByText(/画面が消えると記録が止まります/)).toBeInTheDocument();
    });

    it("画面消灯防止が有効なら注意文は表示しない", () => {
      // Given
      render(<TrackingPanel tracking={activeTracking} />);
      // Then
      expect(
        screen.queryByText(/画面が消えると記録が止まります/)
      ).not.toBeInTheDocument();
    });

    it("精度が悪いとき注意表示が出る", () => {
      // Given: 精度40m（閾値30m超）
      const tracking = makeTracking({
        isTracking: true,
        accuracyMeters: 40,
      });
      // When
      render(<TrackingPanel tracking={tracking} />);
      // Then
      expect(screen.getByText(/精度が低下しています/)).toBeInTheDocument();
    });
  });

  describe("エラー表示", () => {
    it("エラーがあるとアラートとして表示される", () => {
      // Given
      const tracking = makeTracking({
        error: "位置情報の使用が許可されていません。",
      });
      // When
      render(<TrackingPanel tracking={tracking} />);
      // Then
      expect(screen.getByRole("alert")).toHaveTextContent(
        "位置情報の使用が許可されていません。"
      );
    });
  });
});
