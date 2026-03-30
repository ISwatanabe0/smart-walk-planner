import type { WalkRoute } from "@/types/route";
import { RouteDetailCard } from "./RouteDetailCard";

type RouteCandidateListProps = {
  routes: WalkRoute[];
  selectedRouteId: string | null;
  onSelect: (routeId: string) => void;
};

export function RouteCandidateList({
  routes,
  selectedRouteId,
  onSelect,
}: RouteCandidateListProps) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <div className="candidate-list">
      {routes.map((route) => (
        <RouteDetailCard
          key={route.routeId}
          route={route}
          selected={route.routeId === selectedRouteId}
          onClick={() => onSelect(route.routeId)}
        />
      ))}
    </div>
  );
}
