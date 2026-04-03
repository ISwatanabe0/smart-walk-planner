import type { WalkRoute } from "@/types/route";
import type { Coordinate } from "@/types/map";

/** Google Maps URLに設定できる経由点の最大数 */
const MAX_WAYPOINTS = 9;

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

  const origin = `${route.start.lat},${route.start.lng}`;
  const destination = `${route.end.lat},${route.end.lng}`;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "walking",
  });

  // geometry の中間座標を waypoints に設定する
  // 周回ルートでは start === end になるため、中間点がないと Google Maps がルートを生成できない
  const coords = route.geometry.coordinates;
  if (coords.length > 2) {
    const innerCoords = coords.slice(1, coords.length - 1);
    const sampled = sampleCoordinates(innerCoords, MAX_WAYPOINTS);
    params.set(
      "waypoints",
      sampled.map((c) => `${c.lat},${c.lng}`).join("|")
    );
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
