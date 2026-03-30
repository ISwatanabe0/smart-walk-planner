"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinate, RouteGeometry } from "@/types/map";
import type { Waypoint } from "@/types/route";

// Next.js/Webpack では Leaflet のデフォルトアイコン画像パスが壊れるため divIcon を使用
const startIcon = L.divIcon({
  html: '<div style="background:#1a7f5a;width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: "",
});

const waypointIcon = L.divIcon({
  html: '<div style="background:#f97316;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: "",
});

function MapUpdater({ center, zoom }: { center: Coordinate; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

type LeafletMapProps = {
  center: Coordinate;
  zoom: number;
  startMarker: Coordinate | null;
  endMarker: Coordinate | null;
  waypoints: Waypoint[];
  routeGeometry: RouteGeometry | null;
};

export function LeafletMap({
  center,
  zoom,
  startMarker,
  endMarker,
  waypoints,
  routeGeometry,
}: LeafletMapProps) {
  const polylinePositions =
    routeGeometry?.coordinates.map(
      (c): [number, number] => [c.lat, c.lng]
    ) ?? [];

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />

      {startMarker !== null && (
        <Marker position={[startMarker.lat, startMarker.lng]} icon={startIcon}>
          <Popup>出発地点</Popup>
        </Marker>
      )}

      {endMarker !== null && (
        <Marker position={[endMarker.lat, endMarker.lng]} icon={startIcon}>
          <Popup>到着地点</Popup>
        </Marker>
      )}

      {waypoints.map((wp) => (
        <Marker
          key={wp.id}
          position={[wp.position.lat, wp.position.lng]}
          icon={waypointIcon}
        >
          <Popup>{wp.name}</Popup>
        </Marker>
      ))}

      {polylinePositions.length > 0 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: "#1a7f5a", weight: 5, opacity: 0.85 }}
        />
      )}
    </MapContainer>
  );
}
