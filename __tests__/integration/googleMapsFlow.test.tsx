/**
 * インテグレーションテスト: Google Maps 遷移フロー
 *
 * 対象モジュール横断フロー:
 *   useGoogleMapsLink → GoogleMapsButton → ConfirmDialog
 *
 * このテストは3モジュールを横断するデータフローを検証する。
 * ユーザーが「Google Maps で開く」ボタンをクリックし、
 * 確認ダイアログを経由して外部遷移するまでの一連の動作を確認する。
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGoogleMapsLink } from "@/hooks/useGoogleMapsLink";
import { GoogleMapsButton } from "@/components/route/GoogleMapsButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { WalkRoute } from "@/types/route";

// Google Maps URL ビルダーをモック
jest.mock("@/features/walk-planner/services/googleMapsLinkBuilder", () => ({
  buildGoogleMapsUrl: jest.fn(),
}));

import { buildGoogleMapsUrl } from "@/features/walk-planner/services/googleMapsLinkBuilder";

const mockBuildGoogleMapsUrl = buildGoogleMapsUrl as jest.MockedFunction<
  typeof buildGoogleMapsUrl
>;

const TEST_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&origin=35.6812,139.7671&destination=35.6812,139.7671&travelmode=walking";

const mockWindowOpen = jest.fn();

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

beforeEach(() => {
  mockBuildGoogleMapsUrl.mockClear();
  mockWindowOpen.mockClear();
  Object.defineProperty(window, "open", { value: mockWindowOpen, writable: true });
  mockBuildGoogleMapsUrl.mockReturnValue(TEST_GOOGLE_MAPS_URL);
});

/**
 * GoogleMapsButton + ConfirmDialog を組み合わせたテストコンポーネント
 * RouteResultPanel が行う配線を再現する
 */
function GoogleMapsFlowFixture({ route }: { route: WalkRoute | null }) {
  const {
    googleMapsUrl,
    isConfirmDialogOpen,
    openConfirmDialog,
    closeConfirmDialog,
    confirmAndNavigate,
  } = useGoogleMapsLink(route);

  return (
    <>
      <GoogleMapsButton
        onOpenDialog={openConfirmDialog}
        disabled={googleMapsUrl === null}
      />
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        title="Google Maps で開きますか？"
        message="このルートを Google Maps アプリで開きます。"
        confirmLabel="開く"
        cancelLabel="キャンセル"
        onConfirm={confirmAndNavigate}
        onCancel={closeConfirmDialog}
      />
    </>
  );
}

describe("Google Maps 遷移フロー（インテグレーション）", () => {
  describe("route が null のとき", () => {
    it("Google Maps ボタンが無効化されている", () => {
      // Given: ルート未選択
      mockBuildGoogleMapsUrl.mockReturnValue(null);
      // When
      render(<GoogleMapsFlowFixture route={null} />);
      // Then: ボタンは非活性
      const button = screen.getByRole("button", { name: /google maps/i });
      expect(button).toBeDisabled();
    });

    it("ダイアログは表示されない", () => {
      // Given: ルート未選択
      mockBuildGoogleMapsUrl.mockReturnValue(null);
      // When
      render(<GoogleMapsFlowFixture route={null} />);
      // Then: ダイアログは非表示
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("route が存在するとき", () => {
    it("Google Maps ボタンが有効化されている", () => {
      // Given: ルート選択済み
      // When
      render(<GoogleMapsFlowFixture route={mockRoute} />);
      // Then: ボタンは活性
      const button = screen.getByRole("button", { name: /google maps/i });
      expect(button).not.toBeDisabled();
    });

    it("ボタンクリックで確認ダイアログが開く", async () => {
      // Given: ルート選択済み
      const user = userEvent.setup();
      render(<GoogleMapsFlowFixture route={mockRoute} />);
      // When: Google Maps ボタンをクリック
      await user.click(screen.getByRole("button", { name: /google maps/i }));
      // Then: 確認ダイアログが表示される
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("ダイアログの確認後に window.open が呼ばれる", async () => {
      // Given: ルート選択済み、ダイアログ表示中
      const user = userEvent.setup();
      render(<GoogleMapsFlowFixture route={mockRoute} />);
      await user.click(screen.getByRole("button", { name: /google maps/i }));
      // When: 確認ボタンをクリック
      await user.click(screen.getByRole("button", { name: "開く" }));
      // Then: Google Maps URL が新しいタブで開かれる
      expect(mockWindowOpen).toHaveBeenCalledWith(TEST_GOOGLE_MAPS_URL, "_blank");
    });

    it("ダイアログの確認後にダイアログが閉じる", async () => {
      // Given: ルート選択済み、ダイアログ表示中
      const user = userEvent.setup();
      render(<GoogleMapsFlowFixture route={mockRoute} />);
      await user.click(screen.getByRole("button", { name: /google maps/i }));
      // When: 確認ボタンをクリック
      await user.click(screen.getByRole("button", { name: "開く" }));
      // Then: ダイアログが閉じる
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("キャンセル後はダイアログが閉じて window.open は呼ばれない", async () => {
      // Given: ルート選択済み、ダイアログ表示中
      const user = userEvent.setup();
      render(<GoogleMapsFlowFixture route={mockRoute} />);
      await user.click(screen.getByRole("button", { name: /google maps/i }));
      // When: キャンセルボタンをクリック
      await user.click(screen.getByRole("button", { name: "キャンセル" }));
      // Then: ダイアログが閉じ、遷移しない
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });
});
