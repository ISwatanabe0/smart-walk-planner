"use client";

import dynamic from "next/dynamic";
import type { Coordinate, RouteGeometry } from "@/types/map";
import type { Waypoint } from "@/types/route";

// 東京駅をデフォルト中心座標として使用
const DEFAULT_CENTER: Coordinate = { lat: 35.6812, lng: 139.7671 };
const DEFAULT_ZOOM = 14;
const LOCATION_ZOOM = 16;

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((m) => ({ default: m.LeafletMap })),
  {
    ssr: false,
    loading: () => (
      <div className="map-placeholder">
        <div className="spinner" />
        <p>地図を読み込み中...</p>
      </div>
    ),
  }
);

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
  endMarker,
  waypoints,
  routeGeometry,
}: MapViewProps) {
  const mapCenter = center ?? startMarker ?? DEFAULT_CENTER;
  const zoom = center !== null || startMarker !== null ? LOCATION_ZOOM : DEFAULT_ZOOM;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <LeafletMap
        center={mapCenter}
        zoom={zoom}
        startMarker={startMarker}
        endMarker={endMarker}
        waypoints={waypoints}
        routeGeometry={routeGeometry}
      />
    </div>
  );
}
