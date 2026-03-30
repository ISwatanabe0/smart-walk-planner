import type { WalkRoute } from "@/types/route";
import { RouteTags } from "@/components/route/RouteTags";

type RouteDetailCardProps = {
  route: WalkRoute;
  selected: boolean;
  onClick: () => void;
};

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

export function RouteDetailCard({
  route,
  selected,
  onClick,
}: RouteDetailCardProps) {
  const cardClass = ["candidate-card", selected ? "selected" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cardClass} onClick={onClick}>
      <div className="candidate-card-header">
        <span className="candidate-name">
          {route.name ?? `ルート ${route.routeId.slice(-1)}`}
        </span>
      </div>
      <div className="candidate-stats">
        <span>{formatDistance(route.summary.distanceMeters)}</span>
        <span>{route.summary.estimatedMinutes}分</span>
        <span>景観 {route.summary.sceneryScore}</span>
      </div>
      {route.tags.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          <RouteTags tags={route.tags} />
        </div>
      )}
    </button>
  );
}
