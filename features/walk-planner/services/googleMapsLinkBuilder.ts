import type { WalkRoute } from "@/types/route";
import type { Coordinate } from "@/types/map";

/**
 * パスベース形式で設定できる経由点の最大数（start・end を除く）
 * Google Maps のパス形式は最大11ストップ（start + 9中間点 + end）
 */
const MAX_INNER_WAYPOINTS = 9;

/**
 * coords から最大 maxCount 点を等間隔でサンプリングする
 */
function sampleCoordinates(
  coords: Coordinate[],
  maxCount: number
): Coordinate[] {
  if (coords.length <= maxCount) return coords;
  return Array.from({ length: maxCount }, (_, i) => {
    const index = Math.round((i * (coords.length - 1)) / (maxCount - 1));
    return coords[index];
  });
}

export function buildGoogleMapsUrl(route: WalkRoute | null): string | null {
  if (route === null) {
    return null;
  }

  const coords = route.geometry.coordinates;

  if (coords.length > 2) {
    // 周回ルートは coords の末尾が start と同一座標のため除外する。
    // coords.slice(0, -1) = [start, wp1, ..., wpN]（末尾の start を含まない）
    // これにより origin（先頭）≠ destination（末尾の中間点）が保証され、
    // Google Maps がルートを計算できる。
    const coordsForUrl = coords.slice(0, -1);
    const sampled = sampleCoordinates(coordsForUrl, MAX_INNER_WAYPOINTS + 1);
    const pathStr = sampled.map((c) => `${c.lat},${c.lng}`).join("/");
    return `https://www.google.com/maps/dir/${pathStr}?travelmode=walking`;
  }

  // 2点のみの場合はクエリパラメータ形式
  const params = new URLSearchParams({
    api: "1",
    origin: `${route.start.lat},${route.start.lng}`,
    destination: `${route.end.lat},${route.end.lng}`,
    travelmode: "walking",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
