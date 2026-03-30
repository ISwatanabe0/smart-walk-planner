import type { Coordinate, RouteGeometry } from "@/types/map";
import type { Waypoint } from "@/types/route";

type MapViewProps = {
  center: Coordinate | null;
  startMarker: Coordinate | null;
  endMarker: Coordinate | null;
  waypoints: Waypoint[];
  routeGeometry: RouteGeometry | null;
};

export function MapView({
  center,
  startMarker,
  waypoints,
  routeGeometry,
}: MapViewProps) {
  return (
    <div className="map-placeholder">
      <span className="map-placeholder-icon">🗺️</span>
      <p className="map-placeholder-text">地図表示エリア</p>
      {center !== null && (
        <p className="map-coordinates">
          {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </p>
      )}
      {startMarker !== null && (
        <p className="map-coordinates">
          出発地点: {startMarker.lat.toFixed(4)}, {startMarker.lng.toFixed(4)}
        </p>
      )}
      {routeGeometry !== null && (
        <p className="map-coordinates">
          ルート: {routeGeometry.coordinates.length} ポイント
        </p>
      )}
      {waypoints.length > 0 && (
        <p className="map-coordinates">
          経由地点: {waypoints.length} 件
        </p>
      )}
    </div>
  );
}
