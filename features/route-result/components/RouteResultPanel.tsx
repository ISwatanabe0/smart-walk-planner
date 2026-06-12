"use client";

import { RouteSummary } from "@/components/route/RouteSummary";
import { RouteTags } from "@/components/route/RouteTags";
import { RouteSpotList } from "@/components/route/RouteSpotList";
import { GoogleMapsButton } from "@/components/route/GoogleMapsButton";
import { RouteCandidateList } from "./RouteCandidateList";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import type { WalkRoute } from "@/types/route";

type RouteResultPanelProps = {
  routes: WalkRoute[];
  /** 選択中ルートのID（地図表示と一致させるため親が管理する） */
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  onOpenGoogleMaps: (route: WalkRoute) => void;
  onChangeCondition: () => void;
  onRetry: () => void;
};

export function RouteResultPanel({
  routes,
  selectedRouteId,
  onSelectRoute,
  onOpenGoogleMaps,
  onChangeCondition,
  onRetry,
}: RouteResultPanelProps) {
  const selectedRoute =
    routes.find((r) => r.routeId === selectedRouteId) ?? routes[0] ?? null;

  return (
    <div>
      {routes.length > 1 && (
        <SectionCard title="候補ルート">
          <RouteCandidateList
            routes={routes}
            selectedRouteId={selectedRoute?.routeId ?? null}
            onSelect={onSelectRoute}
          />
        </SectionCard>
      )}

      {selectedRoute !== null && (
        <>
          <SectionCard title="ルート概要">
            <RouteSummary summary={selectedRoute.summary} />
            <RouteTags tags={selectedRoute.tags} />
          </SectionCard>

          {selectedRoute.waypoints.length > 0 && (
            <SectionCard title="経由スポット">
              <RouteSpotList spots={selectedRoute.waypoints} />
            </SectionCard>
          )}
        </>
      )}

      <div className="result-actions">
        <GoogleMapsButton
          onOpenDialog={() => {
            if (selectedRoute !== null) {
              onOpenGoogleMaps(selectedRoute);
            }
          }}
          disabled={selectedRoute === null}
        />
        <Button variant="secondary" onClick={onRetry}>
          再検索
        </Button>
        <Button variant="secondary" onClick={onChangeCondition}>
          条件変更
        </Button>
      </div>
    </div>
  );
}
