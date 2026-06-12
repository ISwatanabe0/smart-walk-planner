"use client";

import dynamic from "next/dynamic";
import type { Coordinate, RouteGeometry } from "@/types/map";
import type { Waypoint } from "@/types/route";

// 東京駅をデフォルト中心座標として使用
const DEFAULT_CENTER: Coordinate = { lat: 35.6812, lng: 139.7671 };
const DEFAULT_ZOOM = 14;
const LOCATION_ZOOM = 16;

const MapLibreMap = dynamic(
  () => import("./MapLibreMap").then((m) => ({ default: m.MapLibreMap })),
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
  /** トラッキング中の現在地（青い点で表示） */
  userPosition?: Coordinate | null;
  /** トラッキングで歩いた軌跡 */
  userTrail?: Coordinate[];
  /** 端末の向き（北=0°）。現在地マーカーの向き表示に使う */
  userHeadingDeg?: number | null;
  /** 移動中か（アバターの歩行/待機アニメ切替） */
  userIsMoving?: boolean;
  /** ナビ（現在地追従・3D視点）モードか */
  navMode?: boolean;
  /** 指定すると地図タップで地点を選択できる */
  onMapClick?: (coordinate: Coordinate) => void;
  /** 指定すると出発地点のピンをドラッグで動かせる */
  onMoveStart?: (coordinate: Coordinate) => void;
  /** 指定するとゴール地点のピンをドラッグで動かせる */
  onMoveEnd?: (coordinate: Coordinate) => void;
  /** 地図上部に表示する操作ヒント（null で非表示） */
  hint?: string | null;
};

export function MapView({
  center,
  startMarker,
  endMarker,
  waypoints,
  routeGeometry,
  userPosition = null,
  userTrail = [],
  userHeadingDeg = null,
  userIsMoving = false,
  navMode = false,
  onMapClick,
  onMoveStart,
  onMoveEnd,
  hint = null,
}: MapViewProps) {
  const mapCenter = center ?? startMarker ?? DEFAULT_CENTER;
  const zoom = center !== null || startMarker !== null ? LOCATION_ZOOM : DEFAULT_ZOOM;
  const isSelectable = onMapClick !== undefined;

  return (
    <div
      className={isSelectable ? "map-container map-selectable" : "map-container"}
      style={{ height: "100%", width: "100%" }}
    >
      <MapLibreMap
        center={mapCenter}
        zoom={zoom}
        startMarker={startMarker}
        endMarker={endMarker}
        waypoints={waypoints}
        routeGeometry={routeGeometry}
        userPosition={userPosition}
        userTrail={userTrail}
        bearingDeg={userHeadingDeg}
        isMoving={userIsMoving}
        navMode={navMode}
        onMapClick={onMapClick}
        onMoveStart={onMoveStart}
        onMoveEnd={onMoveEnd}
      />
      {hint !== null && <div className="map-hint">{hint}</div>}
    </div>
  );
}
