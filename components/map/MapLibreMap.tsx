"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinate, RouteGeometry } from "@/types/map";
import type { Waypoint } from "@/types/route";

/**
 * 地図スタイル。既定はOpenFreeMap（APIキー不要・無料・全世界）。
 * 国土地理院ベクトルタイル等に差し替えたい場合は環境変数で上書きできる。
 */
const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/liberty";

/** ナビ（追従）時のズーム・傾き */
const NAV_ZOOM = 17.5;
const NAV_PITCH = 60;

/** 通常時の傾き。常に立体的な奥行きのある視点で表示する */
const DEFAULT_PITCH = 45;

type MapLibreMapProps = {
  center: Coordinate;
  zoom: number;
  startMarker: Coordinate | null;
  endMarker: Coordinate | null;
  waypoints: Waypoint[];
  routeGeometry: RouteGeometry | null;
  userPosition: Coordinate | null;
  userTrail: Coordinate[];
  /** 端末の向き（北=0°）。現在地マーカー（アバター）の向きにのみ使う */
  bearingDeg: number | null;
  /** 移動中か（アバターの歩行/待機アニメ切替） */
  isMoving?: boolean;
  /** ナビ（現在地追従・3D視点）モードか。地図の回転は行わない */
  navMode: boolean;
  onMapClick?: (coordinate: Coordinate) => void;
  onMoveStart?: (coordinate: Coordinate) => void;
  onMoveEnd?: (coordinate: Coordinate) => void;
};

function pinElement(color: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-pin";
  el.innerHTML = `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.72 23.28 0 15 0z" fill="${color}"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`;
  return el;
}

function userElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "user-location-marker";
  el.innerHTML =
    '<div class="user-location-pulse"></div><div class="user-location-cone"></div><div class="user-location-dot"></div>';
  return el;
}

/**
 * 散歩アバター（ビルボード表示のキャラクター）。
 * SVGの各パーツをCSSアニメーションで動かす:
 *  walking: 手足を振って歩く / idle: ゆったり上下する待機モーション
 */
function avatarElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "walk-avatar idle";
  el.innerHTML = `
    <svg viewBox="0 0 40 56" width="40" height="56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse class="avatar-shadow" cx="20" cy="53" rx="11" ry="3" fill="rgba(0,0,0,0.25)"/>
      <g class="avatar-body">
        <g class="avatar-arm-left">
          <rect x="9" y="26" width="5" height="13" rx="2.5" fill="#e8b88a"/>
        </g>
        <g class="avatar-leg-left">
          <rect x="13.5" y="38" width="6" height="13" rx="3" fill="#3b5b92"/>
        </g>
        <g class="avatar-leg-right">
          <rect x="20.5" y="38" width="6" height="13" rx="3" fill="#2e4a7a"/>
        </g>
        <rect x="11" y="24" width="18" height="17" rx="6" fill="#1a7f5a"/>
        <g class="avatar-arm-right">
          <rect x="26" y="26" width="5" height="13" rx="2.5" fill="#e8b88a"/>
        </g>
        <circle cx="20" cy="14" r="9.5" fill="#f2c79b"/>
        <path d="M10.5 12.5 a9.5 9.5 0 0 1 19 0 l0 -1.5 a9.5 8 0 0 0 -19 0 z" fill="#4a3628"/>
        <circle cx="16.5" cy="14.5" r="1.4" fill="#2b2b2b"/>
        <circle cx="23.5" cy="14.5" r="1.4" fill="#2b2b2b"/>
        <path d="M17.5 18.5 q2.5 2 5 0" stroke="#2b2b2b" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;
  return el;
}

function lineFeature(coords: Coordinate[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coords.map((c) => [c.lng, c.lat]),
    },
  };
}

export function MapLibreMap(props: MapLibreMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);

  // 最新のpropsをイベントハンドラから参照するためのref（再初期化を避ける）
  const propsRef = useRef(props);
  propsRef.current = props;

  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const avatarMarkerRef = useRef<maplibregl.Marker | null>(null);
  const waypointMarkersRef = useRef<maplibregl.Marker[]>([]);

  // ---- 初期化（一度だけ）----
  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [props.center.lng, props.center.lat],
      zoom: props.zoom,
      pitch: DEFAULT_PITCH,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    map.on("click", (e) => {
      propsRef.current.onMapClick?.({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      });
    });

    map.on("load", () => {
      // ルート線・歩行軌跡のソースとレイヤー
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#1a7f5a", "line-width": 6, "line-opacity": 0.85 },
      });
      map.addSource("trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#2563eb", "line-width": 6, "line-opacity": 0.9 },
      });

      // 3D建物（OpenMapTiles系スキーマの building レイヤーを立ち上げる）
      try {
        if (map.getSource("openmaptiles") !== undefined) {
          const layers = map.getStyle().layers ?? [];
          const firstSymbol = layers.find((l) => l.type === "symbol")?.id;
          map.addLayer(
            {
              id: "3d-buildings",
              source: "openmaptiles",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": "#dcd6c8",
                "fill-extrusion-height": [
                  "coalesce",
                  ["get", "render_height"],
                  6,
                ],
                "fill-extrusion-base": [
                  "coalesce",
                  ["get", "render_min_height"],
                  0,
                ],
                "fill-extrusion-opacity": 0.85,
              },
            },
            firstSymbol
          );
        }
      } catch {
        // スタイルにbuilding情報がなければ3D建物はスキップ（致命的でない）
      }

      loadedRef.current = true;
      syncRouteData();
      syncTrailData();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // 初期化は一度だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- ルート線の更新 ----
  const syncRouteData = () => {
    const map = mapRef.current;
    if (map === null || !loadedRef.current) {
      return;
    }
    const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    const coords = propsRef.current.routeGeometry?.coordinates ?? [];
    src?.setData({
      type: "FeatureCollection",
      features: coords.length > 1 ? [lineFeature(coords)] : [],
    });
  };

  const syncTrailData = () => {
    const map = mapRef.current;
    if (map === null || !loadedRef.current) {
      return;
    }
    const src = map.getSource("trail") as maplibregl.GeoJSONSource | undefined;
    const coords = propsRef.current.userTrail;
    src?.setData({
      type: "FeatureCollection",
      features: coords.length > 1 ? [lineFeature(coords)] : [],
    });
  };

  useEffect(() => {
    syncRouteData();
    // ルート生成時は全体が収まるようにフィットする
    const map = mapRef.current;
    const coords = props.routeGeometry?.coordinates ?? [];
    if (map === null || coords.length < 2) {
      return;
    }
    const bounds = coords.reduce(
      (b, c) => b.extend([c.lng, c.lat]),
      new maplibregl.LngLatBounds(
        [coords[0].lng, coords[0].lat],
        [coords[0].lng, coords[0].lat]
      )
    );
    map.fitBounds(bounds, { padding: 60, duration: 600 });
  }, [props.routeGeometry]);

  useEffect(() => {
    syncTrailData();
  }, [props.userTrail]);

  // ---- 出発・ゴールピン ----
  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }
    const sync = (
      ref: React.MutableRefObject<maplibregl.Marker | null>,
      coord: Coordinate | null,
      color: string,
      onMove: ((c: Coordinate) => void) | undefined
    ) => {
      if (coord === null) {
        ref.current?.remove();
        ref.current = null;
        return;
      }
      if (ref.current === null) {
        const marker = new maplibregl.Marker({
          element: pinElement(color),
          anchor: "bottom",
          draggable: onMove !== undefined,
        });
        marker.on("dragend", () => {
          const { lng, lat } = marker.getLngLat();
          onMove?.({ lat, lng });
        });
        marker.setLngLat([coord.lng, coord.lat]).addTo(map);
        ref.current = marker;
      } else {
        ref.current.setLngLat([coord.lng, coord.lat]);
        ref.current.setDraggable(onMove !== undefined);
      }
    };
    sync(startMarkerRef, props.startMarker, "#1a7f5a", props.onMoveStart);
    sync(endMarkerRef, props.endMarker, "#dc3545", props.onMoveEnd);
  }, [props.startMarker, props.endMarker, props.onMoveStart, props.onMoveEnd]);

  // ---- 経由スポット ----
  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = props.waypoints.map((wp) => {
      const el = document.createElement("div");
      el.className = "waypoint-dot";
      return new maplibregl.Marker({ element: el })
        .setLngLat([wp.position.lng, wp.position.lat])
        .addTo(map);
    });
  }, [props.waypoints]);

  // ---- 現在地（足元の方向インジケーター + アバター）----
  // 方向インジケーターは地図基準で回転（地図を二本指で回しても実方位を指す）。
  // アバターは常に直立のビルボード表示で、移動中は歩行アニメに切り替える。
  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }
    if (props.userPosition === null) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      avatarMarkerRef.current?.remove();
      avatarMarkerRef.current = null;
      return;
    }
    const lngLat: [number, number] = [
      props.userPosition.lng,
      props.userPosition.lat,
    ];

    if (userMarkerRef.current === null) {
      userMarkerRef.current = new maplibregl.Marker({
        element: userElement(),
        anchor: "center",
        rotationAlignment: "map",
        pitchAlignment: "map",
      })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(lngLat);
    }
    const ground = userMarkerRef.current;
    ground.setRotation(props.bearingDeg ?? 0);
    ground
      .getElement()
      .classList.toggle("has-heading", props.bearingDeg !== null);

    if (avatarMarkerRef.current === null) {
      avatarMarkerRef.current = new maplibregl.Marker({
        element: avatarElement(),
        // 足元が現在地に一致するように下端基準で配置
        anchor: "bottom",
        rotationAlignment: "viewport",
        pitchAlignment: "viewport",
      })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      avatarMarkerRef.current.setLngLat(lngLat);
    }
    const avatarEl = avatarMarkerRef.current.getElement();
    avatarEl.classList.toggle("walking", props.isMoving === true);
    avatarEl.classList.toggle("idle", props.isMoving !== true);
  }, [props.userPosition, props.bearingDeg, props.isMoving]);

  // ---- カメラ（現在地追従・3D視点）----
  // 地図の向きはユーザー操作（二本指回転）に完全に任せ、bearing には一切触れない
  const wasNavRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }
    if (props.navMode && props.userPosition !== null) {
      if (!wasNavRef.current) {
        // ナビ開始時のみズームと3D傾きを設定
        map.easeTo({
          center: [props.userPosition.lng, props.userPosition.lat],
          zoom: NAV_ZOOM,
          pitch: NAV_PITCH,
          duration: 600,
        });
      } else {
        // 以降は現在地への追従のみ（ズーム・傾き・向きはユーザー調整を維持）
        map.easeTo({
          center: [props.userPosition.lng, props.userPosition.lat],
          duration: 300,
        });
      }
      wasNavRef.current = true;
      return;
    }

    if (wasNavRef.current) {
      // ナビ終了時は通常の傾きへ（立体的な奥行きは維持、向きも維持）
      map.easeTo({ pitch: DEFAULT_PITCH, duration: 500 });
      wasNavRef.current = false;
      return;
    }

    // 非ナビ時: 選択地点が画面外のときだけ再センタリング（視点ジャンプ防止）
    if (!map.getBounds().contains([props.center.lng, props.center.lat])) {
      map.easeTo({
        center: [props.center.lng, props.center.lat],
        zoom: props.zoom,
        duration: 500,
      });
    }
  }, [props.navMode, props.userPosition, props.center, props.zoom]);

  // 「向いている方向に地図を合わせる」: 現在地を中心に、地図をコンパス方位へ回す
  const handleFaceHeading = () => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }
    const { userPosition, bearingDeg } = propsRef.current;
    const camera: maplibregl.EaseToOptions = {
      bearing: bearingDeg ?? 0,
      pitch: NAV_PITCH,
      duration: 500,
    };
    if (userPosition !== null) {
      camera.center = [userPosition.lng, userPosition.lat];
      camera.zoom = NAV_ZOOM;
    }
    map.easeTo(camera);
  };

  return (
    <>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      {props.navMode && (
        <button
          type="button"
          className="map-face-heading-btn"
          aria-label="向いている方向に地図を合わせる"
          onClick={handleFaceHeading}
        >
          🧭
        </button>
      )}
    </>
  );
}
