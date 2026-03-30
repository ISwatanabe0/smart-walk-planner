"use client";

import { useState, useEffect } from "react";
import type { WalkRoute } from "@/types/route";

type UseRouteResultReturn = {
  selectedRouteId: string | null;
  selectedRoute: WalkRoute | null;
  selectRoute: (routeId: string) => void;
};

export function useRouteResult(routes: WalkRoute[]): UseRouteResultReturn {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    if (routes.length > 0) {
      setSelectedRouteId(routes[0].routeId);
    } else {
      setSelectedRouteId(null);
    }
  }, [routes]);

  const selectedRoute =
    routes.find((r) => r.routeId === selectedRouteId) ?? null;

  return {
    selectedRouteId,
    selectedRoute,
    selectRoute: setSelectedRouteId,
  };
}
