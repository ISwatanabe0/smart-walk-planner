import type { Coordinate } from "@/types/map";

/**
 * FOSSGIS が運営する歩行者プロファイルの公開OSRMサーバー。
 * router.project-osrm.org は車専用プロファイルしか持たず、
 * 歩道・遊歩道・公園内の小道などを考慮しないため使用しない。
 */
const OSRM_BASE_URL =
  "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

/** Vercel無料プランの関数実行10秒制限内に収めるためのタイムアウト */
const FETCH_TIMEOUT_MS = 8000;

type OsrmRouteResponse = {
  code: string;
  routes: Array<{
    geometry: {
      type: "LineString";
      coordinates: Array<[number, number]>; // GeoJSON: [lng, lat]
    };
    distance: number; // meters
    duration: number; // seconds
  }>;
};

export type OsrmResult = {
  /** GeoJSON形式の座標列 [lng, lat] */
  coordinates: Array<[number, number]>;
  /** 実際の道路距離（メートル） */
  distanceMeters: number;
  /** 推定所要時間（秒） */
  durationSeconds: number;
};

/**
 * OSRM Public API（歩行者プロファイル）を使って徒歩ルートを取得する
 * @param waypoints 経由点の配列（最初と最後が出発・到着地点）
 */
export async function fetchOsrmRoute(
  waypoints: Coordinate[]
): Promise<OsrmResult> {
  if (waypoints.length < 2) {
    throw new Error("経由点は2点以上必要です");
  }

  const coordStr = waypoints.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${OSRM_BASE_URL}/${coordStr}?geometries=geojson&overview=full`;

  // AbortSignal.timeout 非対応環境（古いランタイム等）では signal なしで実行する
  const timeoutSignal =
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
      : undefined;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Next.js Route Handlerではキャッシュしない
      cache: "no-store",
      signal: timeoutSignal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(
        "経路サーバーの応答がありません。時間をおいて再試行してください。"
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`OSRM APIエラー: HTTP ${response.status}`);
  }

  const data: OsrmRouteResponse = await response.json();

  if (data.code !== "Ok" || data.routes.length === 0) {
    throw new Error(`OSRM ルート取得失敗: ${data.code}`);
  }

  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
  };
}
