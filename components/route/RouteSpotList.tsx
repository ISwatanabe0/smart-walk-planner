import type { Waypoint, WaypointType } from "@/types/route";

type RouteSpotListProps = {
  spots: Waypoint[];
};

const SPOT_ICON: Record<WaypointType, string> = {
  park: "🌳",
  tourism: "🏛️",
  waterfront: "🌊",
  landmark: "📍",
  generic: "📌",
};

export function RouteSpotList({ spots }: RouteSpotListProps) {
  if (spots.length === 0) {
    return <p className="spot-list-empty">経由スポットなし</p>;
  }

  return (
    <ul className="spot-list">
      {spots.map((spot) => (
        <li key={spot.id} className="spot-item">
          <span>{SPOT_ICON[spot.type]}</span>
          <span>{spot.name}</span>
        </li>
      ))}
    </ul>
  );
}
