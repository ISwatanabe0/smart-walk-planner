"use client";

import { useRouteResult } from "../hooks/useRouteResult";
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
  onOpenGoogleMaps: (route: WalkRoute) => void;
  onChangeCondition: () => void;
  onRetry: () => void;
};

export function RouteResultPanel({
  routes,
  onOpenGoogleMaps,
  onChangeCondition,
  onRetry,
}: RouteResultPanelProps) {
  const { selectedRouteId, selectedRoute, selectRoute } = useRouteResult(routes);

  return (
    <div>
      {routes.length > 1 && (
        <SectionCard title="候補ルート">
          <RouteCandidateList
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelect={selectRoute}
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
