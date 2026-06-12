import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteResultPanel } from "@/features/route-result/components/RouteResultPanel";
import type { WalkRoute } from "@/types/route";

function makeRoute(id: string, distanceMeters: number): WalkRoute {
  return {
    routeId: id,
    summary: {
      distanceMeters,
      estimatedMinutes: Math.round(distanceMeters / 80),
      sceneryScore: 70,
      trafficLightScore: 70,
      mainRoadAvoidanceScore: 70,
    },
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 35.6, lng: 139.7 },
        { lat: 35.61, lng: 139.71 },
      ],
    },
    start: { lat: 35.6, lng: 139.7 },
    end: { lat: 35.6, lng: 139.7 },
    waypoints: [],
    tags: [],
  };
}

const routes = [
  makeRoute("route-001", 3000),
  makeRoute("route-002", 4000),
  makeRoute("route-003", 5000),
];

function setup(selectedRouteId: string) {
  const onSelectRoute = jest.fn();
  render(
    <RouteResultPanel
      routes={routes}
      selectedRouteId={selectedRouteId}
      onSelectRoute={onSelectRoute}
      onOpenGoogleMaps={jest.fn()}
      onChangeCondition={jest.fn()}
      onRetry={jest.fn()}
    />
  );
  return { onSelectRoute };
}

describe("RouteResultPanel（候補ルートの選択）", () => {
  it("selectedRouteId に対応するルートの概要が表示される", () => {
    // Given: route-002（4.0km）を選択中
    setup("route-002");
    // Then: 概要セクションに 4.0km が表示される（候補カードにも出るため複数可）
    expect(screen.getAllByText("4.0km").length).toBeGreaterThan(0);
  });

  const candidateCardWith = (text: string): HTMLButtonElement => {
    const card = screen
      .getAllByRole("button")
      .find(
        (b) =>
          b.className.includes("candidate-card") &&
          (b.textContent ?? "").includes(text)
      );
    if (card === undefined) {
      throw new Error(`候補カードが見つかりません: ${text}`);
    }
    return card as HTMLButtonElement;
  };

  it("別の候補カードをクリックすると onSelectRoute がそのIDで呼ばれる", async () => {
    // Given
    const user = userEvent.setup();
    const { onSelectRoute } = setup("route-001");
    // When: 3番目の候補（5.0km）をクリック
    await user.click(candidateCardWith("5.0km"));
    // Then: 親へ route-003 が通知される（地図と選択を同期するため）
    expect(onSelectRoute).toHaveBeenCalledWith("route-003");
  });

  it("選択中の候補カードに selected クラスが付く", () => {
    // Given: route-003 を選択中
    setup("route-003");
    // Then
    expect(candidateCardWith("5.0km").className).toContain("selected");
  });
});
