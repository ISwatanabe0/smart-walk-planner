"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinate, RouteGeometry } from "@/types/map";
import type { Waypoint } from "@/types/route";

// Next.js/Webpack では Leaflet のデフォルトアイコン画像パスが壊れるため divIcon を使用
function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
      <path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.72 23.28 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    className: "",
  });
}

const startIcon = pinIcon("#1a7f5a");
const endIcon = pinIcon("#dc3545");

const waypointIcon = L.divIcon({
  html: '<div style="background:#f97316;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: "",
});

// トラッキング中の現在地（青い点が脈打つ「現在地」表示）
const userIcon = L.divIcon({
  html: '<div class="user-location-marker"><div class="user-location-pulse"></div><div class="user-location-dot"></div></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  className: "",
});

function MapUpdater({ center, zoom }: { center: Coordinate; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // 地点が画面内に見えている間は視点を動かさない
    // （地図タップやピンのドラッグのたびに視点が飛ぶのを防ぐ）
    if (map.getBounds().contains([center.lat, center.lng])) {
      return;
    }
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

function RouteFitter({ geometry }: { geometry: RouteGeometry | null }) {
  const map = useMap();
  useEffect(() => {
    if (geometry === null || geometry.coordinates.length === 0) {
      return;
    }
    const bounds = L.latLngBounds(
      geometry.coordinates.map((c): [number, number] => [c.lat, c.lng])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, geometry]);
  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (coordinate: Coordinate) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function dragendHandler(
  onMove: (coordinate: Coordinate) => void
): L.LeafletEventHandlerFnMap {
  return {
    dragend: (e) => {
      const latlng = (e.target as L.Marker).getLatLng();
      onMove({ lat: latlng.lat, lng: latlng.lng });
    },
  };
}

type LeafletMapProps = {
  center: Coordinate;
  zoom: number;
  startMarker: Coordinate | null;
  endMarker: Coordinate | null;
  waypoints: Waypoint[];
  routeGeometry: RouteGeometry | null;
  /** トラッキング中の現在地（青い点で表示） */
  userPosition?: Coordinate | null;
  /** トラッキングで歩いた軌跡 */
  userTrail?: Coordinate[];
  /** 指定すると地図タップで地点を選択できる */
  onMapClick?: (coordinate: Coordinate) => void;
  /** 指定すると出発地点のピンをドラッグで動かせる */
  onMoveStart?: (coordinate: Coordinate) => void;
  /** 指定するとゴール地点のピンをドラッグで動かせる */
  onMoveEnd?: (coordinate: Coordinate) => void;
};

export function LeafletMap({
  center,
  zoom,
  startMarker,
  endMarker,
  waypoints,
  routeGeometry,
  userPosition = null,
  userTrail = [],
  onMapClick,
  onMoveStart,
  onMoveEnd,
}: LeafletMapProps) {
  const polylinePositions =
    routeGeometry?.coordinates.map(
      (c): [number, number] => [c.lat, c.lng]
    ) ?? [];
  const trailPositions = userTrail.map(
    (c): [number, number] => [c.lat, c.lng]
  );

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
      <RouteFitter geometry={routeGeometry} />
      {onMapClick !== undefined && <MapClickHandler onMapClick={onMapClick} />}

      {startMarker !== null && (
        <Marker
          position={[startMarker.lat, startMarker.lng]}
          icon={startIcon}
          draggable={onMoveStart !== undefined}
          eventHandlers={
            onMoveStart !== undefined ? dragendHandler(onMoveStart) : undefined
          }
        >
          <Popup>出発地点</Popup>
        </Marker>
      )}

      {endMarker !== null && (
        <Marker
          position={[endMarker.lat, endMarker.lng]}
          icon={endIcon}
          draggable={onMoveEnd !== undefined}
          eventHandlers={
            onMoveEnd !== undefined ? dragendHandler(onMoveEnd) : undefined
          }
        >
          <Popup>ゴール地点</Popup>
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

      {trailPositions.length > 0 && (
        <Polyline
          positions={trailPositions}
          pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.9 }}
        />
      )}

      {userPosition !== null && (
        <Marker
          position={[userPosition.lat, userPosition.lng]}
          icon={userIcon}
          zIndexOffset={1000}
        >
          <Popup>現在地</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
